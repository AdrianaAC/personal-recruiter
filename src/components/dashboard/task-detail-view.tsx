"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SpecificDateIndicator } from "@/components/ui/specific-date-indicator";
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
  status: string;
};

type TaskDetail = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  isSpecificDate: boolean;
  completed: boolean;
  archivedAt: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
    status: string;
  } | null;
};

type TaskFormState = {
  title: string;
  description: string;
  dueDate: string;
  dueWeek: string;
  scheduleSpecificDate: boolean;
  applicationId: string;
};

const TASK_FIELD_CLASS =
  "w-full rounded-xl border border-amber-300 bg-amber-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-amber-50";
const TASK_TEXTAREA_CLASS =
  "min-h-[120px] w-full rounded-xl border border-amber-300 bg-amber-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-amber-50";
const TASK_SELECT_CLASS =
  "w-full rounded-xl border border-amber-300 bg-amber-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-amber-500 focus:bg-amber-50";
const TASK_TOGGLE_CLASS =
  "flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950";

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString();
}

function formatDateTime(value: string | Date) {
  return new Date(value).toLocaleString();
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildTaskFormState(task: TaskDetail): TaskFormState {
  const date = task.dueDate ? new Date(task.dueDate) : null;

  return {
    title: task.title,
    description: task.description ?? "",
    dueDate: date ? formatDateInputValue(date) : "",
    dueWeek: date ? formatSundayWeekInputValue(date) : "",
    scheduleSpecificDate: task.isSpecificDate ?? Boolean(date),
    applicationId: task.application?.id ?? "",
  };
}

function resolveTaskDueDate(form: TaskFormState) {
  if (form.scheduleSpecificDate) {
    return form.dueDate || "";
  }

  if (!form.dueWeek) {
    return "";
  }

  return getFridayFromSundayWeekInput(form.dueWeek)?.toISOString() ?? "";
}

export function TaskDetailView({
  initialTask,
  applications,
}: {
  initialTask: TaskDetail;
  applications: ApplicationOption[];
}) {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(() =>
    buildTaskFormState(initialTask),
  );
  const [isSaving, setIsSaving] = useState(false);

  function openEdit() {
    setEditForm(buildTaskFormState(task));
    setIsEditing(true);
  }

  function closeEdit() {
    setIsEditing(false);
    setEditForm(buildTaskFormState(task));
  }

  async function handleSave() {
    setIsSaving(true);

    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          dueDate: resolveTaskDueDate(editForm),
          isSpecificDate: editForm.scheduleSpecificDate,
          applicationId: editForm.applicationId,
          completed: task.completed,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update task.");
      }

      const updatedTask = await response.json();
      const linkedApplication = applications.find(
        (application) => application.id === updatedTask.applicationId,
      );

      setTask((currentTask) => ({
        ...currentTask,
        title: updatedTask.title,
        description: updatedTask.description,
        dueDate: updatedTask.dueDate,
        isSpecificDate: updatedTask.isSpecificDate,
        completed: updatedTask.completed,
        archivedAt: updatedTask.archivedAt,
        updatedAt: updatedTask.updatedAt,
        application: linkedApplication
          ? {
              id: linkedApplication.id,
              companyName: linkedApplication.companyName,
              roleTitle: linkedApplication.roleTitle,
              status: linkedApplication.status,
            }
          : null,
      }));

      setIsEditing(false);
      router.refresh();
    } catch {
      alert("Failed to update task.");
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

          <p className="mt-3 text-sm font-medium text-amber-600">Task</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            {task.title}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Review the task details and its linked context.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          >
            View all tasks
          </Link>

          {task.application ? (
            <Link
              href={`/dashboard/applications/${task.application.id}`}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
            >
              Open application
            </Link>
          ) : null}
        </div>
      </div>

      <section className="rounded-3xl border-[3px] border-amber-400 bg-gradient-to-br from-amber-100 via-amber-50 to-white p-6 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
            {task.completed ? "Completed" : "Open"}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
            {task.archivedAt ? "Archived" : "Active"}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
            Due {formatDate(task.dueDate)}
          </span>
          {task.isSpecificDate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
              <SpecificDateIndicator className="h-3 w-3 text-amber-500" />
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
            className="rounded-2xl border border-amber-200 bg-white/90 p-5 shadow-sm transition hover:border-amber-300 hover:bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-950">
                Task details
              </h2>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                Click to edit
              </span>
            </div>

            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                  {task.description || "No description added yet."}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Due date</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDate(task.dueDate)}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Created</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDateTime(task.createdAt)}
                </dd>
              </div>

              <div>
                <dt className="font-medium text-slate-500">Last updated</dt>
                <dd className="mt-1 text-slate-800">
                  {formatDateTime(task.updatedAt)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-950">Context</h2>

            {task.application ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">
                  Linked application
                </p>
                <h3 className="mt-2 text-base font-semibold text-slate-950">
                  {task.application.companyName}
                </h3>
                <p className="mt-1 text-sm text-slate-700">
                  {task.application.roleTitle}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Status: {formatLabel(task.application.status)}
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                This is a standalone task and is not linked to any application.
              </div>
            )}
          </div>
        </div>
      </section>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit task
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Update this task and save your changes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
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
                  className={TASK_FIELD_CLASS}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Schedule
                </label>
                <label className={TASK_TOGGLE_CLASS}>
                  <input
                    type="checkbox"
                    checked={editForm.scheduleSpecificDate}
                    onChange={(event) =>
                      setEditForm((currentForm) => ({
                        ...currentForm,
                        scheduleSpecificDate: event.target.checked,
                      }))
                    }
                    className="accent-amber-500"
                  />
                  Schedule for specific date
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  {editForm.scheduleSpecificDate ? "Date" : "Week"}
                </label>
                {editForm.scheduleSpecificDate ? (
                  <input
                    type="date"
                    value={editForm.dueDate}
                    onChange={(event) =>
                      setEditForm((currentForm) => ({
                        ...currentForm,
                        dueDate: event.target.value,
                      }))
                    }
                    className={`${TASK_FIELD_CLASS} calendar-themed-input calendar-themed-input-amber`}
                  />
                ) : (
                  <WeekDateInput
                    value={editForm.dueWeek}
                    onChange={(value) =>
                      setEditForm((currentForm) => ({
                        ...currentForm,
                        dueWeek: value,
                      }))
                    }
                    tone="amber"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(event) =>
                    setEditForm((currentForm) => ({
                      ...currentForm,
                      description: event.target.value,
                    }))
                  }
                  className={TASK_TEXTAREA_CLASS}
                />
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
                  className={TASK_SELECT_CLASS}
                >
                  <option value="">Standalone task</option>
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
                  className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
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
