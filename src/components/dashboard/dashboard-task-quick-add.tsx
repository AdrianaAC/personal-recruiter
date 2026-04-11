"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDateInputValue,
  formatSundayWeekInputValue,
  getFridayFromSundayWeekInput,
} from "@/lib/scheduling";
import { WeekDateInput } from "@/components/dashboard/week-date-input";

type ApplicationOption = {
  id: string;
  companyName: string;
  roleTitle: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  applications: ApplicationOption[];
  initialDueDate?: string | null;
};

const TASK_FIELD_CLASS =
  "w-full rounded-md border border-amber-300 bg-amber-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-amber-50";
const TASK_TOGGLE_CLASS =
  "flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950";

export function DashboardTaskQuickAdd({
  open,
  onClose,
  applications,
  initialDueDate,
}: Props) {
  const router = useRouter();
  const initialDate = initialDueDate ? new Date(initialDueDate) : null;

  const [title, setTitle] = useState("");
  const [scheduleSpecificDate, setScheduleSpecificDate] = useState(
    Boolean(initialDueDate),
  );
  const [dueWeek, setDueWeek] = useState(
    initialDate ? formatSundayWeekInputValue(initialDate) : "",
  );
  const [dueDate, setDueDate] = useState(
    initialDate ? formatDateInputValue(initialDate) : "",
  );
  const [applicationId, setApplicationId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const resolvedDueDate = scheduleSpecificDate
      ? dueDate || undefined
      : getFridayFromSundayWeekInput(dueWeek)?.toISOString();

    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        dueDate: resolvedDueDate,
        isSpecificDate: scheduleSpecificDate,
        applicationId: applicationId || null,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Failed to create task.");
      return;
    }

    setTitle("");
    setScheduleSpecificDate(Boolean(initialDueDate));
    setDueWeek(initialDate ? formatSundayWeekInputValue(initialDate) : "");
    setDueDate("");
    setApplicationId("");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl border border-amber-200 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-950">New Task</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={TASK_FIELD_CLASS}
            required
          />

          <label className={TASK_TOGGLE_CLASS}>
            <input
              type="checkbox"
              checked={scheduleSpecificDate}
              onChange={(event) =>
                setScheduleSpecificDate(event.target.checked)
              }
              className="accent-amber-500"
            />
            Schedule for specific date
          </label>

          {scheduleSpecificDate ? (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`${TASK_FIELD_CLASS} calendar-themed-input calendar-themed-input-amber`}
            />
          ) : (
            <WeekDateInput
              value={dueWeek}
              onChange={setDueWeek}
              tone="amber"
            />
          )}

          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className={TASK_FIELD_CLASS}
          >
            <option value="">No application (standalone task)</option>
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
              className="rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="rounded-md bg-amber-500 px-4 py-2 text-sm text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
