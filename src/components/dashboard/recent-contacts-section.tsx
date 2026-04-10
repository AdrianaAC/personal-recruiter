"use client";

import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { DashboardContactQuickAdd } from "./dashboard-contact-quick-add";
import { DeleteConfirmModal } from "./delete-confirm-modal";

type RecentContact = {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  linkedinUrl: string | null;
  companyName: string | null;
  jobTitle: string | null;
  notes?: string | null;
  updatedAt: string | Date;
  applicationLinksCount: number;
  applications?: Array<{
    application: {
      id?: string;
      companyName: string;
      roleTitle: string;
    };
  }>;
};

type ContactFormState = {
  fullName: string;
  phone: string;
  email: string;
  linkedinUrl: string;
  companyName: string;
  jobTitle: string;
  notes: string;
};

type RecentContactsSectionProps = {
  contacts: RecentContact[];
  title?: string;
  description?: string;
  viewHref?: string | null;
  viewLabel?: string;
  countLabel?: string;
  secondaryCountLabel?: string;
  tertiaryCountLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  showAddContactAction?: boolean;
  addContactLabel?: string;
  largeAddContactAction?: boolean;
  enableContactEditing?: boolean;
};

const initialContactFormState: ContactFormState = {
  fullName: "",
  phone: "",
  email: "",
  linkedinUrl: "",
  companyName: "",
  jobTitle: "",
  notes: "",
};

function formatRelativeDate(value: string | Date | null | undefined) {
  if (!value) {
    return "recently";
  }

  const date = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / (1000 * 60));
  const hours = Math.round(diff / (1000 * 60 * 60));
  const days = Math.round(diff / (1000 * 60 * 60 * 24));

  if (minutes < 60) {
    return `${Math.max(1, minutes)}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 14) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
}

function sortContactsByUpdatedAt(contactList: RecentContact[]) {
  return [...contactList].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function RecentContactsSection({
  contacts,
  title = "Contacts",
  description = "The people behind your opportunities.",
  viewHref = null,
  viewLabel = "View contacts",
  countLabel = "contacts",
  secondaryCountLabel = "with email",
  tertiaryCountLabel = "with LinkedIn",
  emptyTitle = "No contacts yet",
  emptyDescription = "Add contacts to start building your relationship map.",
  showAddContactAction = false,
  addContactLabel = "Add contact",
  largeAddContactAction = false,
  enableContactEditing = false,
}: RecentContactsSectionProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [contactItems, setContactItems] = useState(() =>
    sortContactsByUpdatedAt(contacts),
  );
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [pendingDeleteContact, setPendingDeleteContact] = useState<{
    id: string;
    label: string;
  } | null>(null);
  const [editForm, setEditForm] = useState<ContactFormState>(initialContactFormState);
  const [initialEditForm, setInitialEditForm] = useState<ContactFormState>(
    initialContactFormState,
  );
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingContact, setIsDeletingContact] = useState(false);
  const [copyingContactId, setCopyingContactId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const itemsPerPage = 5;

  useEffect(() => {
    setContactItems(sortContactsByUpdatedAt(contacts));
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return contactItems;
    }

    return contactItems.filter((contact) => {
      const haystack = [
        contact.fullName,
        contact.phone ?? "",
        contact.email ?? "",
        contact.companyName ?? "",
        contact.jobTitle ?? "",
        contact.applications?.[0]?.application.companyName ?? "",
        contact.applications?.[0]?.application.roleTitle ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [contactItems, deferredSearchQuery]);

  const emailContactsCount = useMemo(
    () => contactItems.filter((contact) => contact.email).length,
    [contactItems],
  );
  const linkedInContactsCount = useMemo(
    () => contactItems.filter((contact) => contact.linkedinUrl).length,
    [contactItems],
  );
  const totalPages = Math.max(1, Math.ceil(filteredContacts.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const visibleContacts = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredContacts.slice(start, start + itemsPerPage);
  }, [filteredContacts, page]);

  const currentItemCount = visibleContacts.length;
  const displayedItemCount = Math.min(page * itemsPerPage, filteredContacts.length);

  async function handleDeleteContact(contactId: string) {
    const contact = contactItems.find((item) => item.id === contactId);
    if (!contact) {
      return;
    }

    setPendingDeleteContact({
      id: contact.id,
      label: contact.fullName,
    });
  }

  async function confirmDeleteContact() {
    if (!pendingDeleteContact) {
      return;
    }

    const previousContacts = contactItems;
    setIsDeletingContact(true);
    setContactItems((currentContacts) =>
      currentContacts.filter((contact) => contact.id !== pendingDeleteContact.id),
    );

    try {
      const response = await fetch(`/api/contacts/${pendingDeleteContact.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete contact.");
      }

      setPendingDeleteContact(null);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setContactItems(previousContacts);
      alert("Failed to delete contact.");
    } finally {
      setIsDeletingContact(false);
    }
  }

  async function handleCopyContact(contactId: string) {
    setCopyingContactId(contactId);

    try {
      const response = await fetch(`/api/contacts/${contactId}/duplicate`, {
        method: "POST",
      });

      const duplicatedContact = await response.json().catch(() => null);

      if (!response.ok || !duplicatedContact) {
        throw new Error("Failed to duplicate contact.");
      }

      setContactItems((currentContacts) =>
        sortContactsByUpdatedAt([duplicatedContact, ...currentContacts]),
      );

      startTransition(() => {
        router.refresh();
      });
    } catch {
      alert("Failed to duplicate contact.");
    } finally {
      setCopyingContactId(null);
    }
  }

  function openEditContact(contact: RecentContact) {
    const nextFormState = {
      fullName: contact.fullName,
      phone: contact.phone ?? "",
      email: contact.email ?? "",
      linkedinUrl: contact.linkedinUrl ?? "",
      companyName: contact.companyName ?? "",
      jobTitle: contact.jobTitle ?? "",
      notes: contact.notes ?? "",
    };

    setEditingContactId(contact.id);
    setEditForm(nextFormState);
    setInitialEditForm(nextFormState);
  }

  function closeEditContact() {
    setEditingContactId(null);
    setEditForm(initialContactFormState);
    setInitialEditForm(initialContactFormState);
  }

  async function handleSaveEditContact() {
    if (!editingContactId) {
      return;
    }

    const changedFields = Object.fromEntries(
      (Object.entries(editForm) as Array<[keyof ContactFormState, string]>).filter(
        ([field, value]) => value !== initialEditForm[field],
      ),
    );

    if (Object.keys(changedFields).length === 0) {
      closeEditContact();
      return;
    }

    setIsSavingEdit(true);

    try {
      const response = await fetch(`/api/contacts/${editingContactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changedFields),
      });

      const updatedContact = await response.json().catch(() => null);

      if (!response.ok || !updatedContact) {
        throw new Error("Failed to update contact.");
      }

      setContactItems((currentContacts) =>
        sortContactsByUpdatedAt(
          currentContacts.map((contact) =>
            contact.id === editingContactId
              ? {
                  ...contact,
                  fullName: updatedContact.fullName,
                  phone: updatedContact.phone,
                  email: updatedContact.email,
                  linkedinUrl: updatedContact.linkedinUrl,
                  companyName: updatedContact.companyName,
                  jobTitle: updatedContact.jobTitle,
                  notes: updatedContact.notes,
                  updatedAt: updatedContact.updatedAt,
                  applicationLinksCount: updatedContact.applications?.length ?? 0,
                  applications:
                    updatedContact.applications?.map(
                      (applicationLink: {
                        application: {
                          id: string;
                          companyName: string;
                          roleTitle: string;
                        };
                      }) => ({
                        application: {
                          id: applicationLink.application.id,
                          companyName: applicationLink.application.companyName,
                          roleTitle: applicationLink.application.roleTitle,
                        },
                      }),
                    ) ?? [],
                }
              : contact,
          ),
        ),
      );

      closeEditContact();

      startTransition(() => {
        router.refresh();
      });
    } catch {
      alert("Failed to update contact.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border-[3px] border-slate-900 bg-gradient-to-br from-slate-300 via-slate-100 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-700">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {viewHref ? (
            <a
              href={viewHref}
              className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-slate-100"
            >
              {viewLabel}
            </a>
          ) : null}

          {showAddContactAction ? (
            <button
              type="button"
              onClick={() => setIsContactModalOpen(true)}
              className={`inline-flex items-center rounded-full font-semibold text-white transition hover:bg-slate-800 ${
                largeAddContactAction
                  ? "bg-slate-900 px-4 py-2 text-sm"
                  : "bg-slate-900 px-3 py-1.5 text-xs"
              }`}
            >
              {addContactLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {contactItems.length} {countLabel}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {emailContactsCount} {secondaryCountLabel}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {linkedInContactsCount} {tertiaryCountLabel}
          </span>
        </div>

        <div className="w-full md:max-w-[12rem]">
          <label htmlFor="dashboard-contact-search" className="sr-only">
            Search contacts
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 text-slate-400"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>

            <input
              id="dashboard-contact-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search contacts..."
              className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
            />
          </div>
        </div>
      </div>

      {filteredContacts.length === 0 ? (
        <div className="mt-6 flex-1 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">
            {contactItems.length === 0 ? emptyTitle : "No matching contacts"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {contactItems.length === 0
              ? emptyDescription
              : "Try a different search to find the contact you want."}
          </p>
        </div>
      ) : (
        <div className="mt-6 mb-4 flex-1 space-y-4">
          {visibleContacts.map((contact) => (
            <div
              key={contact.id}
              className={`min-h-[124px] rounded-2xl border border-slate-300 bg-gradient-to-r from-white via-slate-50/60 to-white px-4 py-3 shadow-md transition hover:shadow-lg ${
                enableContactEditing ? "cursor-pointer" : ""
              }`}
              onClick={() => {
                if (enableContactEditing) {
                  openEditContact(contact);
                }
              }}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_max-content_minmax(0,1fr)] lg:items-center lg:gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {contact.fullName}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                    {[
                      contact.phone,
                      contact.email,
                      contact.linkedinUrl ? "LinkedIn" : null,
                    ]
                      .filter(Boolean)
                      .map((item, index, items) => (
                        <span
                          key={`${contact.id}-meta-${index}`}
                          className="inline-flex items-center gap-2"
                        >
                          <span>{item}</span>
                          {index < items.length - 1 ? (
                            <span
                              aria-hidden="true"
                              className="text-base leading-none text-slate-500"
                            >
                              •
                            </span>
                          ) : null}
                        </span>
                      ))}
                    {!contact.phone && !contact.email && !contact.linkedinUrl ? (
                      <span>No contact details</span>
                    ) : null}
                  </div>

                  <p
                    className="mt-3 truncate whitespace-nowrap text-sm text-slate-500"
                    title={
                      contact.applications?.[0]?.application
                        ? `${contact.applications[0].application.companyName} · ${contact.applications[0].application.roleTitle}`
                        : "No application"
                    }
                  >
                    {contact.applications?.[0]?.application
                      ? `${contact.applications[0].application.companyName} · ${contact.applications[0].application.roleTitle}`
                      : "No application"}
                  </p>
                </div>

                <div className="flex flex-nowrap items-center justify-center gap-1 self-center text-[10px] leading-none">
                  <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-300">
                    {contact.applicationLinksCount > 0
                      ? "Application contact"
                      : "General contact"}
                  </span>

                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ring-1 ${
                      contact.email
                        ? "bg-sky-100 text-sky-900 ring-sky-300"
                        : "bg-slate-100 text-slate-700 ring-slate-300"
                    }`}
                  >
                    {contact.email ? "Email" : "No email"}
                  </span>

                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ring-1 ${
                      contact.linkedinUrl
                        ? "bg-sky-100 text-sky-900 ring-sky-300"
                        : "bg-slate-100 text-slate-700 ring-slate-300"
                    }`}
                  >
                    {contact.linkedinUrl ? "LinkedIn" : "No LinkedIn"}
                  </span>

                  <span
                    className="inline-flex items-center whitespace-nowrap rounded-full bg-white px-2 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200"
                    title={new Date(contact.updatedAt).toLocaleString()}
                  >
                    Updated {formatRelativeDate(contact.updatedAt)}
                  </span>
                </div>

                <div className="flex justify-end lg:justify-self-end">
                  <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleDeleteContact(contact.id);
                      }}
                      aria-label={`Delete ${contact.fullName}`}
                      title="Delete contact"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-4 w-4"
                      >
                        <path d="M4 7h16" strokeLinecap="round" />
                        <path d="M10 11v6" strokeLinecap="round" />
                        <path d="M14 11v6" strokeLinecap="round" />
                        <path
                          d="M6 7l1 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-11"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        void handleCopyContact(contact.id);
                      }}
                      disabled={copyingContactId === contact.id}
                      aria-label={`Duplicate ${contact.fullName}`}
                      title="Duplicate contact"
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-slate-400 hover:bg-slate-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {copyingContactId === contact.id ? (
                        <span className="h-3 w-3 rounded-sm border border-current border-r-transparent" />
                      ) : (
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          className="h-4 w-4"
                        >
                          <rect
                            x="9"
                            y="9"
                            width="10"
                            height="10"
                            rx="2"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredContacts.length > 0 ? (
        <div className="mt-6 flex justify-center text-sm text-slate-600 md:mt-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-24 text-center font-medium text-slate-700">
              {currentItemCount} of {filteredContacts.length}
              {displayedItemCount} of {filteredContacts.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <DashboardContactQuickAdd
        open={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
      />

      <DeleteConfirmModal
        open={pendingDeleteContact !== null}
        itemLabel={pendingDeleteContact?.label ?? "this contact"}
        itemType="contact"
        onCancel={() => {
          if (!isDeletingContact) {
            setPendingDeleteContact(null);
          }
        }}
        onConfirm={confirmDeleteContact}
        busy={isDeletingContact}
      />

      {editingContactId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-[3px]">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-xl">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Edit Contact</h3>
              <p className="mt-1 text-sm text-slate-600">
                Update the contact details and save your changes.
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        phone: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">LinkedIn URL</label>
                <input
                  type="url"
                  value={editForm.linkedinUrl}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      linkedinUrl: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Company</label>
                  <input
                    type="text"
                    value={editForm.companyName}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Job title</label>
                  <input
                    type="text"
                    value={editForm.jobTitle}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        jobTitle: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 bg-slate-100/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:bg-slate-100"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEditContact}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleSaveEditContact()}
                disabled={isSavingEdit}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingEdit ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
