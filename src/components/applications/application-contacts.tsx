"use client";

import { useMemo, useState } from "react";
import { applicationContactRoleValues } from "@/lib/validations/contact";

type Contact = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  companyName: string | null;
  jobTitle: string | null;
  notes: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type ApplicationContactItem = {
  id: string;
  role: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  contact: Contact;
};

type ApplicationContactsProps = {
  applicationId: string;
  initialContacts: ApplicationContactItem[];
};

type ContactFormValues = {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  companyName: string;
  jobTitle: string;
  notes: string;
  role: string;
};

type AttachExistingValues = {
  contactId: string;
  role: string;
};

const emptyCreateForm: ContactFormValues = {
  fullName: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  companyName: "",
  jobTitle: "",
  notes: "",
  role: "OTHER",
};

const emptyAttachForm: AttachExistingValues = {
  contactId: "",
  role: "OTHER",
};

function buildCreatePayload(values: ContactFormValues) {
  return {
    fullName: values.fullName.trim(),
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    linkedinUrl: values.linkedinUrl.trim() || undefined,
    companyName: values.companyName.trim() || undefined,
    jobTitle: values.jobTitle.trim() || undefined,
    notes: values.notes.trim() || undefined,
    role: values.role,
  };
}

function buildUpdateContactPayload(values: Omit<ContactFormValues, "role">) {
  return {
    fullName: values.fullName.trim() || undefined,
    email: values.email.trim() || undefined,
    phone: values.phone.trim() || undefined,
    linkedinUrl: values.linkedinUrl.trim() || undefined,
    companyName: values.companyName.trim() || undefined,
    jobTitle: values.jobTitle.trim() || undefined,
    notes: values.notes.trim() || undefined,
  };
}

function formatRoleLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildEditFormFromContact(item: ApplicationContactItem) {
  return {
    fullName: item.contact.fullName ?? "",
    email: item.contact.email ?? "",
    phone: item.contact.phone ?? "",
    linkedinUrl: item.contact.linkedinUrl ?? "",
    companyName: item.contact.companyName ?? "",
    jobTitle: item.contact.jobTitle ?? "",
    notes: item.contact.notes ?? "",
  };
}

export function ApplicationContacts({
  applicationId,
  initialContacts,
}: ApplicationContactsProps) {
  const [contacts, setContacts] =
    useState<ApplicationContactItem[]>(initialContacts);
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAttachOpen, setIsAttachOpen] = useState(false);

  const [createValues, setCreateValues] =
    useState<ContactFormValues>(emptyCreateForm);
  const [attachValues, setAttachValues] =
    useState<AttachExistingValues>(emptyAttachForm);

  const [editingRelationId, setEditingRelationId] = useState<string | null>(
    null,
  );
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Omit<ContactFormValues, "role">>(
    {
      fullName: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      companyName: "",
      jobTitle: "",
      notes: "",
    },
  );

  const [loadingAvailableContacts, setLoadingAvailableContacts] =
    useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isAttaching, setIsAttaching] = useState(false);
  const [savingRoleId, setSavingRoleId] = useState<string | null>(null);
  const [savingContactId, setSavingContactId] = useState<string | null>(null);
  const [removingRelationId, setRemovingRelationId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const attachedContactIds = useMemo(
    () => new Set(contacts.map((item) => item.contact.id)),
    [contacts],
  );

  const attachableContacts = useMemo(() => {
    return availableContacts.filter(
      (contact) => !attachedContactIds.has(contact.id),
    );
  }, [availableContacts, attachedContactIds]);

  async function loadAvailableContacts() {
    setLoadingAvailableContacts(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts");
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to load contacts.");
      }

      setAvailableContacts(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contacts.");
    } finally {
      setLoadingAvailableContacts(false);
    }
  }

  function startCreate() {
    setError(null);
    setIsCreateOpen((prev) => !prev);
  }

  async function startAttach() {
    const next = !isAttachOpen;
    setIsAttachOpen(next);
    setError(null);

    if (next && availableContacts.length === 0) {
      await loadAvailableContacts();
    }
  }

  function startEditing(item: ApplicationContactItem) {
    setError(null);
    setEditingRelationId(item.id);
    setEditingContactId(item.contact.id);
    setEditValues(buildEditFormFromContact(item));
  }

  function cancelEditing() {
    setEditingRelationId(null);
    setEditingContactId(null);
    setEditValues({
      fullName: "",
      email: "",
      phone: "",
      linkedinUrl: "",
      companyName: "",
      jobTitle: "",
      notes: "",
    });
  }

  async function handleCreateContact(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsCreating(true);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildCreatePayload(createValues)),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create contact.");
      }

      setContacts((prev) => [data, ...prev]);
      setCreateValues(emptyCreateForm);
      setIsCreateOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create contact.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAttachExisting(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsAttaching(true);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/contacts`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attachValues),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to attach contact.");
      }

      setContacts((prev) => [data, ...prev]);
      setAttachValues(emptyAttachForm);
      setIsAttachOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to attach contact.",
      );
    } finally {
      setIsAttaching(false);
    }
  }

  async function handleRoleChange(applicationContactId: string, role: string) {
    setError(null);
    setSavingRoleId(applicationContactId);

    try {
      const response = await fetch(
        `/api/application-contacts/${applicationContactId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update role.");
      }

      setContacts((prev) =>
        prev.map((item) => (item.id === applicationContactId ? data : item)),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSavingRoleId(null);
    }
  }

  async function handleSaveContact(
    e: React.FormEvent<HTMLFormElement>,
    contactId: string,
  ) {
    e.preventDefault();
    setError(null);
    setSavingContactId(contactId);

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildUpdateContactPayload(editValues)),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update contact.");
      }

      setContacts((prev) =>
        prev.map((item) =>
          item.contact.id === contactId
            ? {
                ...item,
                contact: {
                  ...item.contact,
                  ...data,
                },
              }
            : item,
        ),
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update contact.",
      );
    } finally {
      setSavingContactId(null);
    }
  }

  async function handleDetach(applicationContactId: string) {
    const confirmed = window.confirm(
      "Remove this contact from the application?",
    );
    if (!confirmed) return;

    setError(null);
    setRemovingRelationId(applicationContactId);

    try {
      const response = await fetch(
        `/api/application-contacts/${applicationContactId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to remove contact.");
      }

      setContacts((prev) =>
        prev.filter((item) => item.id !== applicationContactId),
      );

      if (editingRelationId === applicationContactId) {
        cancelEditing();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove contact.",
      );
    } finally {
      setRemovingRelationId(null);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
          <p className="mt-1 text-sm text-gray-600">
            Keep track of recruiters, hiring managers, interviewers, and other
            people connected to this application.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startCreate}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            {isCreateOpen ? "Close form" : "Add new contact"}
          </button>

          <button
            type="button"
            onClick={startAttach}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            {isAttachOpen ? "Close attach" : "Attach existing"}
          </button>
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isCreateOpen ? (
        <form
          onSubmit={handleCreateContact}
          className="mt-5 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={createValues.fullName}
                onChange={(e) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    fullName: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Relationship role
              </label>
              <select
                value={createValues.role}
                onChange={(e) =>
                  setCreateValues((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              >
                {applicationContactRoleValues.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={createValues.email}
                onChange={(e) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="text"
                value={createValues.phone}
                onChange={(e) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                LinkedIn URL
              </label>
              <input
                type="url"
                value={createValues.linkedinUrl}
                onChange={(e) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    linkedinUrl: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Company
              </label>
              <input
                type="text"
                value={createValues.companyName}
                onChange={(e) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    companyName: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Job title
              </label>
              <input
                type="text"
                value={createValues.jobTitle}
                onChange={(e) =>
                  setCreateValues((prev) => ({
                    ...prev,
                    jobTitle: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              rows={4}
              value={createValues.notes}
              onChange={(e) =>
                setCreateValues((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isCreating}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? "Saving..." : "Save contact"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateValues(emptyCreateForm);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {isAttachOpen ? (
        <form
          onSubmit={handleAttachExisting}
          className="mt-5 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Existing contact
              </label>
              <select
                value={attachValues.contactId}
                onChange={(e) =>
                  setAttachValues((prev) => ({
                    ...prev,
                    contactId: e.target.value,
                  }))
                }
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              >
                <option value="" disabled>
                  {loadingAvailableContacts
                    ? "Loading contacts..."
                    : "Choose a contact"}
                </option>

                {attachableContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.fullName}
                    {contact.companyName ? ` — ${contact.companyName}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Relationship role
              </label>
              <select
                value={attachValues.role}
                onChange={(e) =>
                  setAttachValues((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              >
                {applicationContactRoleValues.map((role) => (
                  <option key={role} value={role}>
                    {formatRoleLabel(role)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isAttaching || loadingAvailableContacts}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAttaching ? "Attaching..." : "Attach contact"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAttachOpen(false);
                setAttachValues(emptyAttachForm);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {contacts.length === 0 ? (
        <p className="mt-5 text-sm text-gray-600">
          No contacts attached to this application yet.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {contacts.map((item) => {
            const isEditing = editingRelationId === item.id;
            const isSavingRole = savingRoleId === item.id;
            const isRemoving = removingRelationId === item.id;
            const isSavingContact = savingContactId === item.contact.id;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleSaveContact(e, item.contact.id)}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Full name
                        </label>
                        <input
                          type="text"
                          required
                          value={editValues.fullName}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              fullName: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Email
                        </label>
                        <input
                          type="email"
                          value={editValues.email}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Phone
                        </label>
                        <input
                          type="text"
                          value={editValues.phone}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={editValues.linkedinUrl}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              linkedinUrl: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Company
                        </label>
                        <input
                          type="text"
                          value={editValues.companyName}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              companyName: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                          Job title
                        </label>
                        <input
                          type="text"
                          value={editValues.jobTitle}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              jobTitle: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <textarea
                        rows={4}
                        value={editValues.notes}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isSavingContact}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSavingContact ? "Saving..." : "Save changes"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {item.contact.fullName}
                          </h3>

                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                            {formatRoleLabel(item.role)}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-gray-600">
                          {item.contact.jobTitle || "—"}
                          {item.contact.companyName
                            ? ` • ${item.contact.companyName}`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(item)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDetach(item.id)}
                          disabled={isRemoving}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isRemoving ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Role on application
                        </p>
                        <select
                          value={item.role}
                          onChange={(e) =>
                            handleRoleChange(item.id, e.target.value)
                          }
                          disabled={isSavingRole}
                          className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {applicationContactRoleValues.map((role) => (
                            <option key={role} value={role}>
                              {formatRoleLabel(role)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Email
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-800">
                          {item.contact.email ? (
                            <a
                              href={`mailto:${item.contact.email}`}
                              className="text-blue-600 underline"
                            >
                              {item.contact.email}
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Phone
                        </p>
                        <p className="mt-1 text-sm text-gray-800">
                          {item.contact.phone || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          LinkedIn
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-800">
                          {item.contact.linkedinUrl ? (
                            <a
                              href={item.contact.linkedinUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 underline"
                            >
                              Open profile
                            </a>
                          ) : (
                            "—"
                          )}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3 md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                          {item.contact.notes || "—"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
