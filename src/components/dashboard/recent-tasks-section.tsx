"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  formatDateInputValue,
  formatSundayWeekInputValue,
  getFridayFromSundayWeekInput,
} from "@/lib/scheduling";
import { SpecificDateIndicator } from "@/components/ui/specific-date-indicator";
import { WeekDateInput } from "@/components/dashboard/week-date-input";
import { DeleteConfirmModal } from "./delete-confirm-modal";
import { DashboardTaskQuickAdd } from "./dashboard-task-quick-add";

type RecentTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  isSpecificDate?: boolean;
  updatedAt?: string | Date;
  href?: string | null;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
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

type RecentTasksSectionProps = {
  tasks: RecentTask[];
  title?: string;
  description?: string;
  viewHref?: string | null;
  viewLabel?: string;
  countLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  checkboxLabel?: string;
  showAddTaskAction?: boolean;
  addTaskLabel?: string;
  largeAddTaskAction?: boolean;
  enableTaskEditing?: boolean;
  itemActionMode?: "complete" | "delete";
  showDeleteAction?: boolean;
  showCopyAction?: boolean;
  addTaskApplications?: {
    id: string;
    companyName: string;
    roleTitle: string;
  }[];
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

function buildTaskFormState(task?: {
  title?: string;
  description?: string | null;
  dueDate?: string | Date | null;
  isSpecificDate?: boolean;
  applicationId?: string | null;
}): TaskFormState {
  const date = task?.dueDate ? new Date(task.dueDate) : null;

  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    dueDate: date ? formatDateInputValue(date) : "",
    dueWeek: date ? formatSundayWeekInputValue(date) : "",
    scheduleSpecificDate: task?.isSpecificDate ?? Boolean(date),
    applicationId: task?.applicationId ?? "",
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

function sortTasksByUpdatedAt(taskList: RecentTask[]) {
  return [...taskList].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

    return bTime - aTime;
  });
}

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

function TaskCheckbox({
  taskId,
  onAction,
  label,
  variant = "complete",
  compact = false,
  wrapDelete = true,
}: {
  taskId: string;
  onAction: (taskId: string) => Promise<void>;
  label: string;
  variant?: "complete" | "delete";
  compact?: boolean;
  wrapDelete?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function runAction() {
    setLoading(true);
    await onAction(taskId);
    setLoading(false);
  }

  return (
    <div
      className={
        variant === "delete" && wrapDelete
          ? "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm"
          : ""
      }
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          void runAction();
        }}
        disabled={loading}
      aria-label={label}
      title={label}
      className={`inline-flex items-center justify-center bg-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
          variant === "delete"
            ? `${compact ? "h-8 w-8" : "h-9 w-9"} rounded-full border border-transparent text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600`
            : `${compact ? "h-7 w-7" : "h-8 w-8"} rounded-md border border-amber-300 text-amber-700 hover:bg-amber-50`
        }`}
      >
        {loading ? (
          <span className="h-3 w-3 rounded-sm border border-current border-r-transparent" />
        ) : variant === "delete" ? (
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
        ) : null}
      </button>
    </div>
  );
}

export function RecentTasksSection({
  tasks,
  title = "Recent Tasks",
  description = "The action items that need your attention next.",
  viewHref = "/dashboard/tasks",
  viewLabel = "View tasks",
  countLabel = "open",
  emptyTitle = "No open tasks",
  emptyDescription = "Add tasks from the dashboard or attach them to applications.",
  checkboxLabel = "Mark task as done",
  showAddTaskAction = false,
  addTaskLabel = "Add task",
  largeAddTaskAction = false,
  enableTaskEditing = false,
  itemActionMode = "complete",
  showDeleteAction = false,
  showCopyAction = false,
  addTaskApplications = [],
}: RecentTasksSectionProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [taskItems, setTaskItems] = useState(() => sortTasksByUpdatedAt(tasks));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [pendingDeleteTask, setPendingDeleteTask] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState>(buildTaskFormState());
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [copyingTaskId, setCopyingTaskId] = useState<string | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const itemsPerPage = 5;

  useEffect(() => {
    setTaskItems(sortTasksByUpdatedAt(tasks));
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return taskItems;
    }

    return taskItems.filter((task) => {
      const haystack = [
        task.title,
        task.description ?? "",
        task.application?.companyName ?? "",
        task.application?.roleTitle ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredSearchQuery, taskItems]);

  const linkedTasksCount = useMemo(
    () => taskItems.filter((task) => task.application).length,
    [taskItems],
  );
  const standaloneTasksCount = taskItems.length - linkedTasksCount;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const visibleTasks = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, page]);

  const displayedItemCount = Math.min(page * itemsPerPage, filteredTasks.length);

  async function handleCompleteTask(taskId: string) {
    const previousTasks = taskItems;

    setTaskItems((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to update task.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setTaskItems(previousTasks);
      alert("Failed to update task.");
    }
  }

  async function handleDeleteTask(taskId: string) {
    const taskToDelete = taskItems.find((task) => task.id === taskId);
    if (!taskToDelete) {
      return;
    }

    setPendingDeleteTask({
      id: taskToDelete.id,
      title: taskToDelete.title,
    });
  }

  async function confirmDeleteTask() {
    if (!pendingDeleteTask) {
      return;
    }

    const previousTasks = taskItems;
    setIsDeletingTask(true);

    setTaskItems((currentTasks) =>
      currentTasks.filter((task) => task.id !== pendingDeleteTask.id),
    );

    try {
      const res = await fetch(`/api/tasks/${pendingDeleteTask.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete task.");
      }

      setPendingDeleteTask(null);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setTaskItems(previousTasks);
      alert("Failed to delete task.");
    } finally {
      setIsDeletingTask(false);
    }
  }

  async function handleCopyTask(taskId: string) {
    setCopyingTaskId(taskId);

    try {
      const res = await fetch(`/api/tasks/${taskId}/duplicate`, {
        method: "POST",
      });

      const duplicatedTask = await res.json().catch(() => null);

      if (!res.ok || !duplicatedTask) {
        throw new Error("Failed to duplicate task.");
      }

      setTaskItems((currentTasks) =>
        sortTasksByUpdatedAt([duplicatedTask, ...currentTasks]),
      );

      startTransition(() => {
        router.refresh();
      });
    } catch {
      alert("Failed to duplicate task.");
    } finally {
      setCopyingTaskId(null);
    }
  }

  function openEditTask(task: RecentTask) {
    setEditingTaskId(task.id);
    setEditForm(
      buildTaskFormState({
        title: task.title,
        description: task.description ?? "",
        dueDate: task.dueDate,
        isSpecificDate: task.isSpecificDate,
        applicationId: task.application?.id ?? "",
      }),
    );
  }

  function closeEditTask() {
    setEditingTaskId(null);
    setEditForm(buildTaskFormState());
  }

  async function handleSaveEditTask() {
    if (!editingTaskId) {
      return;
    }

    setIsSavingEdit(true);

    try {
      const res = await fetch(`/api/tasks/${editingTaskId}`, {
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
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update task.");
      }

      const updatedTask = await res.json();

      setTaskItems((currentTasks) =>
        sortTasksByUpdatedAt(
          currentTasks.map((task) =>
            task.id === editingTaskId
              ? {
                  ...task,
                  title: updatedTask.title,
                  description: updatedTask.description,
                  dueDate: updatedTask.dueDate,
                  isSpecificDate: updatedTask.isSpecificDate,
                  updatedAt: updatedTask.updatedAt,
                  application:
                    addTaskApplications.find(
                      (application) => application.id === updatedTask.applicationId,
                    ) ?? null,
                }
              : task,
          ),
        ),
      );
      closeEditTask();

      startTransition(() => {
        router.refresh();
      });
    } catch {
      alert("Failed to update task.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border-[3px] border-amber-400 bg-gradient-to-br from-amber-100 via-amber-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-amber-950/70">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {viewHref ? (
            <Link
              href={viewHref}
              className="inline-flex items-center rounded-full border border-amber-200 bg-white px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-50"
            >
              {viewLabel}
            </Link>
          ) : null}

          {showAddTaskAction ? (
            <button
              type="button"
              onClick={() => setIsTaskModalOpen(true)}
              className={`inline-flex items-center rounded-full font-semibold text-white transition hover:bg-amber-600 ${
                largeAddTaskAction
                  ? "bg-amber-500 px-4 py-2 text-sm"
                  : "bg-amber-500 px-3 py-1.5 text-xs"
              }`}
            >
              {addTaskLabel}
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-amber-200/80 bg-white/85 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
            {taskItems.length} {countLabel}
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
            {linkedTasksCount} linked
          </span>
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-950 ring-1 ring-amber-200">
            {standaloneTasksCount} standalone
          </span>
        </div>

        <div className="w-full md:max-w-[12rem]">
          <label htmlFor="dashboard-task-search" className="sr-only">
            Search tasks
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/70 px-3 py-2">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-4 w-4 text-amber-500"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>

            <input
              id="dashboard-task-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks..."
              className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none placeholder:text-amber-700/55"
            />
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="mt-6 flex-1 rounded-2xl border border-dashed border-amber-300 bg-amber-50/40 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">
            {taskItems.length === 0 ? emptyTitle : "No matching tasks"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {taskItems.length === 0
              ? emptyDescription
              : "Try a different search to find the task you want."}
          </p>
        </div>
      ) : (
        <div className="mt-6 mb-4 flex-1 space-y-4">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              role={
                enableTaskEditing
                  ? "button"
                  : task.href
                    ? "link"
                    : undefined
              }
              tabIndex={enableTaskEditing || task.href ? 0 : undefined}
              className={`min-h-[124px] rounded-2xl border border-amber-200 bg-gradient-to-r from-white via-amber-50/40 to-white px-4 py-3 shadow-md transition hover:shadow-lg ${
                enableTaskEditing || task.href ? "cursor-pointer" : ""
              }`}
              onClick={() => {
                if (enableTaskEditing) {
                  openEditTask(task);
                  return;
                }

                if (task.href) {
                  router.push(task.href);
                }
              }}
              onKeyDown={(event) => {
                if (event.key !== "Enter" && event.key !== " ") {
                  return;
                }

                event.preventDefault();

                if (enableTaskEditing) {
                  openEditTask(task);
                  return;
                }

                if (task.href) {
                  router.push(task.href);
                }
              }}
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_auto_auto] lg:items-center lg:gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {task.isSpecificDate ? (
                      <span className="mr-2 inline-flex align-middle">
                        <SpecificDateIndicator className="h-3.5 w-3.5 text-amber-500" />
                      </span>
                    ) : null}
                    {task.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                    <span>{formatDate(task.dueDate)}</span>
                    <span
                      aria-hidden="true"
                      className="text-base leading-none text-amber-500"
                    >
                      ●
                    </span>
                    <span>{task.description ?? "No description"}</span>
                  </div>

                  <p
                    className="mt-3 truncate whitespace-nowrap text-sm text-slate-500"
                    title={
                      task.application
                        ? `${task.application.companyName} · ${task.application.roleTitle}`
                        : "Standalone task"
                    }
                  >
                    {task.application
                      ? `${task.application.companyName} · ${task.application.roleTitle}`
                      : "Standalone task"}
                  </p>
                </div>

                <div className="flex flex-nowrap items-center justify-center gap-1 self-center text-[10px] leading-none lg:-translate-x-2">
                  {task.application ? (
                    <Link
                      href={`/dashboard/applications/${task.application.id}`}
                      onClick={(event) => event.stopPropagation()}
                      className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900 ring-1 ring-emerald-300 transition hover:bg-emerald-200"
                    >
                      Open application
                    </Link>
                  ) : (
                    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 ring-1 ring-amber-300">
                      General task
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ring-1 ${
                      itemActionMode === "delete"
                        ? "bg-rose-100 text-rose-900 ring-rose-300"
                        : "bg-amber-100 text-amber-900 ring-amber-300"
                    }`}
                  >
                    {itemActionMode === "delete" ? "Closed" : "Open"}
                  </span>

                  <span
                    className="inline-flex items-center whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-amber-200"
                    title={task.updatedAt ? new Date(task.updatedAt).toLocaleString() : undefined}
                  >
                    Updated {formatRelativeDate(task.updatedAt ?? task.dueDate)}
                  </span>
                </div>

                <div
                  className={`flex ${
                    itemActionMode === "complete" && showDeleteAction
                      ? "h-full flex-col items-end justify-between py-1"
                      : "justify-end"
                  }`}
                >
                  <div
                    className={
                      itemActionMode === "complete" && showDeleteAction
                        ? "-ml-[10px]"
                        : ""
                    }
                  >
                    <TaskCheckbox
                      taskId={task.id}
                      onAction={
                        itemActionMode === "delete"
                          ? handleDeleteTask
                          : handleCompleteTask
                      }
                      label={
                        itemActionMode === "delete"
                          ? "Delete task"
                          : checkboxLabel
                      }
                      variant={itemActionMode}
                      compact={itemActionMode === "complete" && showDeleteAction}
                    />
                  </div>

                  {itemActionMode === "complete" && showDeleteAction ? (
                    <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
                      <TaskCheckbox
                        taskId={task.id}
                        onAction={handleDeleteTask}
                        label="Delete task"
                        variant="delete"
                        compact
                        wrapDelete={false}
                      />

                      {showCopyAction ? (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleCopyTask(task.id);
                          }}
                          disabled={copyingTaskId === task.id}
                          aria-label="Duplicate task"
                          title="Duplicate task"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-slate-400 hover:bg-slate-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {copyingTaskId === task.id ? (
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
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTasks.length > 0 ? (
        <div className="mt-6 flex justify-center text-sm text-slate-600 md:mt-auto">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex h-9 items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-4 font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-24 text-center font-medium text-amber-950">
              {displayedItemCount} of {filteredTasks.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="inline-flex h-9 items-center justify-center rounded-full border border-amber-300 bg-amber-50 px-4 font-medium text-amber-900 transition hover:border-amber-400 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <DashboardTaskQuickAdd
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        applications={addTaskApplications}
      />

      <DeleteConfirmModal
        open={pendingDeleteTask !== null}
        itemLabel={pendingDeleteTask?.title ?? "this task"}
        itemType="task"
        onCancel={() => {
          if (!isDeletingTask) {
            setPendingDeleteTask(null);
          }
        }}
        onConfirm={confirmDeleteTask}
        busy={isDeletingTask}
      />

      {editingTaskId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-white p-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit task
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Update the task details and save your changes.
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditTask}
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
                <p className="text-xs text-slate-500">
                  {!editForm.scheduleSpecificDate && editForm.dueWeek
                    ? "Week-based tasks are placed on Friday of the selected week."
                    : "Use a specific day when timing matters, or plan it by week number."}
                </p>
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
                  {addTaskApplications.map((application) => (
                    <option key={application.id} value={application.id}>
                      {application.companyName} - {application.roleTitle}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditTask}
                  className="rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditTask}
                  disabled={isSavingEdit}
                  className="rounded-full bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
