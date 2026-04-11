"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpecificDateIndicator } from "@/components/ui/specific-date-indicator";
import {
  formatDateTimeInputValue,
  formatSundayWeekInputValue,
  getFridayFromSundayWeekInput,
} from "@/lib/scheduling";
import { WeekDateInput } from "@/components/dashboard/week-date-input";

type ApplicationOption = {
  id: string;
  companyName: string;
  roleTitle: string;
  status: string;
};

type ContactOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
};

type CallUpDetail = {
  id: string;
  title: string;
  notes: string | null;
  scheduledAt: string | Date | null;
  isSpecificDate: boolean;
  status: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
    status: string;
  } | null;
  contact: {
    id: string;
    fullName: string;
    companyName: string | null;
    jobTitle: string | null;
    email: string | null;
    phone: string | null;
    linkedinUrl: string | null;
  } | null;
};

type CallUpFormState = {
  title: string;
  notes: string;
  scheduledAt: string;
  scheduledWeek: string;
  scheduleSpecificDate: boolean;
  applicationId: string;
  contactId: string;
};

const FOLLOWUP_FIELD_CLASS =
  "w-full rounded-xl border border-sky-300 bg-sky-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-sky-50";
const FOLLOWUP_TEXTAREA_CLASS =
  "min-h-[120px] w-full rounded-xl border border-sky-300 bg-sky-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-sky-50";
const FOLLOWUP_SELECT_CLASS =
  "w-full rounded-xl border border-sky-300 bg-sky-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-sky-50";
const FOLLOWUP_TOGGLE_CLASS =
  "flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950";

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleString();
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCallUpFormState(callUp: CallUpDetail): CallUpFormState {
  const scheduledDate = callUp.scheduledAt ? new Date(callUp.scheduledAt) : null;

  return {
    title: callUp.title,
    notes: callUp.notes ?? "",
    scheduledAt: scheduledDate ? formatDateTimeInputValue(scheduledDate) : "",
    scheduledWeek: scheduledDate ? formatSundayWeekInputValue(scheduledDate) : "",
    scheduleSpecificDate: callUp.isSpecificDate ?? Boolean(scheduledDate),
    applicationId: callUp.application?.id ?? "",
    contactId: callUp.contact?.id ?? "",
  };
}

function resolveScheduledAt(form: CallUpFormState) {
  if (form.scheduleSpecificDate) {
    return form.scheduledAt || "";
  }

  if (!form.scheduledWeek) {
    return "";
  }

  return getFridayFromSundayWeekInput(form.scheduledWeek)?.toISOString() ?? "";
}

export function CallUpDetailView({
  initialCallUp,
  applications,
  contacts,
}: {
  initialCallUp: CallUpDetail;
  applications: ApplicationOption[];
  contacts: ContactOption[];
}) {
  const router = useRouter();
  const [callUp, setCallUp] = useState(initialCallUp);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(() =>
    buildCallUpFormState(initialCallUp),
  );
  const [isSaving, setIsSaving] = useState(false);

  function openEdit() {
    setEditForm(buildCallUpFormState(callUp));
    setIsEditing(true);
  }

  function closeEdit() {
    setIsEditing(false);
    setEditForm(buildCallUpFormState(callUp));
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/call-ups/${callUp.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editForm.title,
          notes: editForm.notes,
          scheduledAt: resolveScheduledAt(editForm),
          isSpecificDate: editForm.scheduleSpecificDate,
          applicationId: editForm.applicationId,
          contactId: editForm.contactId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update FollowUp.");
      }

      const updatedCallUp = await response.json();
      const linkedApplication = applications.find(
        (application) => application.id === updatedCallUp.applicationId,
      );
      const linkedContact = contacts.find(
        (contact) => contact.id === updatedCallUp.contactId,
      );

      setCallUp((currentCallUp) => ({
        ...currentCallUp,
        title: updatedCallUp.title,
        notes: updatedCallUp.notes,
        scheduledAt: updatedCallUp.scheduledAt,
        isSpecificDate: updatedCallUp.isSpecificDate,
        status: updatedCallUp.status,
        updatedAt: updatedCallUp.updatedAt,
        application: linkedApplication
          ? {
              id: linkedApplication.id,
              companyName: linkedApplication.companyName,
              roleTitle: linkedApplication.roleTitle,
              status: linkedApplication.status,
            }
          : null,
        contact: linkedContact
          ? {
              id: linkedContact.id,
              fullName: linkedContact.fullName,
              companyName: linkedContact.companyName,
              jobTitle: linkedContact.jobTitle,
              email: linkedContact.email,
              phone: linkedContact.phone,
              linkedinUrl: linkedContact.linkedinUrl,
            }
          : null,
      }));

      setIsEditing(false);
      router.refresh();
    } catch {
      alert("Failed to update FollowUp.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-sm text-slate-500 underline">
            Back to dashboard
          </Link>

          <p className="mt-3 text-sm font-medium text-sky-600">FollowUp</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {callUp.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review the follow-up details, contact, and related application.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/call-ups"
            className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
          >
            View all FollowUps
          </Link>

          {callUp.application ? (
            <Link
              href={`/dashboard/applications/${callUp.application.id}`}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
            >
              Open application
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border-[3px] border-sky-400 bg-gradient-to-br from-sky-100 via-sky-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-950 ring-1 ring-sky-200">
            {formatLabel(callUp.status)}
          </span>
          <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-950 ring-1 ring-sky-200">
            Scheduled {formatDate(callUp.scheduledAt)}
          </span>
          {callUp.isSpecificDate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
              <SpecificDateIndicator className="h-3 w-3 text-sky-500" />
              Specific date
            </span>
          ) : null}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,1fr)]">
          <div
            role="button"
            tabIndex={0}
            onClick={openEdit}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openEdit();
              }
            }}
            className="rounded-2xl border border-sky-200 bg-white/90 p-5 shadow-sm transition hover:border-sky-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">
                FollowUp details
              </h2>
              <span className="rounded-full bg-sky-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-sky-800">
                Click to edit
              </span>
            </div>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Notes</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                  {callUp.notes || "No notes added yet."}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Created</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDate(callUp.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Last updated</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDate(callUp.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">Contact</h2>

              {callUp.contact ? (
                <div className="mt-4 space-y-2 text-sm text-rose-950/80">
                  <p className="text-base font-semibold text-slate-950">
                    {callUp.contact.fullName}
                  </p>
                  <p>
                    {callUp.contact.jobTitle || "No job title"}
                    {callUp.contact.companyName
                      ? ` at ${callUp.contact.companyName}`
                      : ""}
                  </p>
                  <p>{callUp.contact.email || "No email saved"}</p>
                  <p>{callUp.contact.phone || "No phone saved"}</p>
                  {callUp.contact.linkedinUrl ? (
                    <a
                      href={callUp.contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex text-rose-700 underline"
                    >
                      Open LinkedIn
                    </a>
                  ) : null}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-rose-300 bg-rose-50 p-4 text-sm text-rose-950/75">
                  No contact is linked to this FollowUp.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-950">
                Application
              </h2>

              {callUp.application ? (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                  <p className="text-base font-semibold text-slate-950">
                    {callUp.application.companyName}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {callUp.application.roleTitle}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Status: {formatLabel(callUp.application.status)}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                  This is a standalone FollowUp and is not linked to an
                  application.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-sky-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit FollowUp
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Update this FollowUp and save your changes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full border border-sky-300 bg-sky-50 px-3 py-1.5 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Title
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(event) =>
                    setEditForm((currentForm) => ({
                      ...currentForm,
                      title: event.target.value,
                    }))
                  }
                  className={FOLLOWUP_FIELD_CLASS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Schedule
                </label>
                <label className={FOLLOWUP_TOGGLE_CLASS}>
                  <input
                    type="checkbox"
                    checked={editForm.scheduleSpecificDate}
                    onChange={(event) =>
                      setEditForm((currentForm) => ({
                        ...currentForm,
                        scheduleSpecificDate: event.target.checked,
                      }))
                    }
                    className="accent-sky-500"
                  />
                  Schedule for specific date
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {editForm.scheduleSpecificDate ? "Date and time" : "Week"}
                </label>
                {editForm.scheduleSpecificDate ? (
                  <input
                    type="datetime-local"
                    value={editForm.scheduledAt}
                    onChange={(event) =>
                      setEditForm((currentForm) => ({
                        ...currentForm,
                        scheduledAt: event.target.value,
                      }))
                    }
                    className={`${FOLLOWUP_FIELD_CLASS} calendar-themed-input calendar-themed-input-sky`}
                  />
                ) : (
                  <WeekDateInput
                    value={editForm.scheduledWeek}
                    onChange={(value) =>
                      setEditForm((currentForm) => ({
                        ...currentForm,
                        scheduledWeek: value,
                      }))
                    }
                    tone="sky"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(event) =>
                    setEditForm((currentForm) => ({
                      ...currentForm,
                      notes: event.target.value,
                    }))
                  }
                  className={FOLLOWUP_TEXTAREA_CLASS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Contact
                </label>
                <select
                  value={editForm.contactId}
                  onChange={(event) =>
                    setEditForm((currentForm) => ({
                      ...currentForm,
                      contactId: event.target.value,
                    }))
                  }
                  className={FOLLOWUP_SELECT_CLASS}
                >
                  <option value="">No linked contact</option>
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.fullName}
                      {contact.companyName ? ` - ${contact.companyName}` : ""}
                      {contact.jobTitle ? ` (${contact.jobTitle})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Application
                </label>
                <select
                  value={editForm.applicationId}
                  onChange={(event) =>
                    setEditForm((currentForm) => ({
                      ...currentForm,
                      applicationId: event.target.value,
                    }))
                  }
                  className={FOLLOWUP_SELECT_CLASS}
                >
                  <option value="">No application</option>
                  {applications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.companyName} - {application.roleTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
