"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
};

type ContactOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobTitle: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  applications: ApplicationOption[];
  contacts: ContactOption[];
  initialScheduledAt?: string | null;
};

const FOLLOWUP_FIELD_CLASS =
  "w-full rounded-md border border-sky-300 bg-sky-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:bg-sky-50";
const FOLLOWUP_TOGGLE_CLASS =
  "flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-950";

export function DashboardCallUpQuickAdd({
  open,
  onClose,
  applications,
  contacts,
  initialScheduledAt,
}: Props) {
  const router = useRouter();
  const initialDate = initialScheduledAt ? new Date(initialScheduledAt) : null;

  const [title, setTitle] = useState("");
  const [scheduleSpecificDate, setScheduleSpecificDate] = useState(
    Boolean(initialScheduledAt),
  );
  const [scheduledWeek, setScheduledWeek] = useState(
    initialDate ? formatSundayWeekInputValue(initialDate) : "",
  );
  const [scheduledAt, setScheduledAt] = useState(
    initialDate ? formatDateTimeInputValue(initialDate) : "",
  );
  const [applicationId, setApplicationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!contactId) {
      alert("Please choose a contact.");
      return;
    }

    setLoading(true);

    const resolvedScheduledAt = scheduleSpecificDate
      ? scheduledAt || undefined
      : getFridayFromSundayWeekInput(scheduledWeek)?.toISOString();

    const res = await fetch("/api/call-ups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        scheduledAt: resolvedScheduledAt,
        isSpecificDate: scheduleSpecificDate,
        applicationId: applicationId || null,
        contactId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(errorText);
      alert("Failed to create FollowUp.");
      return;
    }

    setTitle("");
    setScheduleSpecificDate(Boolean(initialScheduledAt));
    setScheduledWeek(initialDate ? formatSundayWeekInputValue(initialDate) : "");
    setScheduledAt(initialDate ? formatDateTimeInputValue(initialDate) : "");
    setApplicationId("");
    setContactId("");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl border border-sky-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-950">New FollowUp</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            placeholder="FollowUp title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={FOLLOWUP_FIELD_CLASS}
            required
          />

          <label className={FOLLOWUP_TOGGLE_CLASS}>
            <input
              type="checkbox"
              checked={scheduleSpecificDate}
              onChange={(event) =>
                setScheduleSpecificDate(event.target.checked)
              }
              className="accent-sky-500"
            />
            Schedule for specific date
          </label>

          {scheduleSpecificDate ? (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={`${FOLLOWUP_FIELD_CLASS} calendar-themed-input calendar-themed-input-sky`}
            />
          ) : (
            <WeekDateInput
              value={scheduledWeek}
              onChange={setScheduledWeek}
              tone="sky"
            />
          )}

          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className={FOLLOWUP_FIELD_CLASS}
            required
          >
            <option value="">Choose a contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName}
                {contact.companyName ? ` — ${contact.companyName}` : ""}
                {contact.jobTitle ? ` (${contact.jobTitle})` : ""}
              </option>
            ))}
          </select>

          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className={FOLLOWUP_FIELD_CLASS}
          >
            <option value="">No application (standalone FollowUp)</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.companyName} — {application.roleTitle}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="rounded-md bg-sky-500 px-4 py-2 text-sm text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
