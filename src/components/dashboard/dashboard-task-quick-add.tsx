"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  formatDateInputValue,
  formatWeekInputValue,
  getFridayFromWeekInput,
} from "@/lib/scheduling";

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
    initialDate ? formatWeekInputValue(initialDate) : "",
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
      : getFridayFromWeekInput(dueWeek)?.toISOString();

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
    setDueWeek(initialDate ? formatWeekInputValue(initialDate) : "");
    setDueDate("");
    setApplicationId("");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">New Task</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            placeholder="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />

          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={scheduleSpecificDate}
              onChange={(event) =>
                setScheduleSpecificDate(event.target.checked)
              }
            />
            Schedule for specific date
          </label>

          {scheduleSpecificDate ? (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          ) : (
            <input
              type="week"
              value={dueWeek}
              onChange={(e) => setDueWeek(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
            />
          )}

          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
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
              className="text-sm text-gray-600"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="rounded-md bg-black px-4 py-2 text-sm text-white"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
