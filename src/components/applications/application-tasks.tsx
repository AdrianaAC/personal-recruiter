"use client";

import { useState, type ReactNode } from "react";
import {
  formatDateInputValue,
  formatWeekInputValue,
  getFridayFromWeekInput,
} from "@/lib/scheduling";
import { SpecificDateIndicator } from "@/components/ui/specific-date-indicator";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  isSpecificDate?: boolean;
  completed: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type ApplicationTasksProps = {
  applicationId: string;
  initialTasks: Task[];
  extraContent?: ReactNode;
};

type TaskFormState = {
  title: string;
  description: string;
  dueDate: string;
  dueWeek: string;
  scheduleSpecificDate: boolean;
};

async function readJsonSafely(response: Response) {
  return response.json().catch(() => null);
}

function formatDate(value: string | Date | null) {
  if (!value) return "No due date";
  return new Date(value).toLocaleDateString();
}

function toDateInputValue(value: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return date.toISOString().split("T")[0];
}

function buildTaskFormState(task?: {
  title?: string;
  description?: string | null;
  dueDate?: string | Date | null;
  isSpecificDate?: boolean;
}): TaskFormState {
  const date = task?.dueDate ? new Date(task.dueDate) : null;

  return {
    title: task?.title ?? "",
    description: task?.description ?? "",
    dueDate: date ? formatDateInputValue(date) : "",
    dueWeek: date ? formatWeekInputValue(date) : "",
    scheduleSpecificDate: task?.isSpecificDate ?? Boolean(date),
  };
}

function resolveTaskDueDate(form: TaskFormState) {
  if (form.scheduleSpecificDate) {
    return form.dueDate || "";
  }

  if (!form.dueWeek) {
    return "";
  }

  return getFridayFromWeekInput(form.dueWeek)?.toISOString() ?? "";
}

export function ApplicationTasks({
  applicationId,
  initialTasks,
  extraContent,
}: ApplicationTasksProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [form, setForm] = useState<TaskFormState>(buildTaskFormState());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState>(buildTaskFormState());

  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  function sortTasks(taskList: Task[]) {
    return [...taskList].sort((a, b) => {
      if (a.completed !== b.completed) {
        return Number(a.completed) - Number(b.completed);
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditForm(buildTaskFormState(task));
    setError(null);
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditForm(buildTaskFormState());
    setError(null);
  }

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          dueDate: resolveTaskDueDate(form),
          isSpecificDate: form.scheduleSpecificDate,
        }),
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(result?.error || `Failed to create task (${response.status}).`);
        return;
      }

      setTasks((prev) => sortTasks([result, ...prev]));
      setForm(buildTaskFormState());
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating the task.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleSaveEdit(taskId: string) {
    setIsSavingEdit(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/tasks/${taskId}`,
        {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          dueDate: resolveTaskDueDate(editForm),
          isSpecificDate: editForm.scheduleSpecificDate,
        }),
        },
      );

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(result?.error || `Failed to update task (${response.status}).`);
        return;
      }

      setTasks((prev) =>
        sortTasks(prev.map((task) => (task.id === taskId ? result : task))),
      );
      setEditingTaskId(null);
      setEditForm(buildTaskFormState());
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating the task.");
    } finally {
      setIsSavingEdit(false);
    }
  }

  async function handleDeleteTask(taskId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this task?",
    );

    if (!confirmed) {
      return;
    }

    setDeletingTaskId(taskId);
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/tasks/${taskId}`,
        {
        method: "DELETE",
        },
      );

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(result?.error || `Failed to delete task (${response.status}).`);
        return;
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      if (editingTaskId === taskId) {
        setEditingTaskId(null);
        setEditForm(buildTaskFormState());
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while deleting the task.");
    } finally {
      setDeletingTaskId(null);
    }
  }

  async function handleToggleCompleted(task: Task) {
    setError(null);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/tasks/${task.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: task.title,
            description: task.description ?? "",
            dueDate: toDateInputValue(task.dueDate),
            isSpecificDate: task.isSpecificDate ?? false,
            completed: !task.completed,
          }),
        },
      );

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(
          result?.error || `Failed to update task status (${response.status}).`,
        );
        return;
      }

      setTasks((prev) =>
        sortTasks(prev.map((item) => (item.id === task.id ? result : item))),
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong while updating task status.");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Add Task</h2>
        <p className="mt-1 text-sm text-gray-600">
          Track next actions for this application.
        </p>

        <form onSubmit={handleCreateTask} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title *
            </label>
            <input
              id="task-title"
              type="text"
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="e.g. Send FollowUp email"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="task-description" className="text-sm font-medium">
              Description
            </label>
            <textarea
              id="task-description"
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              placeholder="Optional details about the task..."
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.scheduleSpecificDate}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    scheduleSpecificDate: e.target.checked,
                  }))
                }
              />
              Schedule for specific date
            </label>
          </div>

          <div className="space-y-2">
            <label htmlFor="task-due-date" className="text-sm font-medium">
              {form.scheduleSpecificDate ? "Due Date" : "Due Week"}
            </label>
            {form.scheduleSpecificDate ? (
              <input
                id="task-due-date"
                type="date"
                value={form.dueDate}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dueDate: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            ) : (
              <input
                id="task-due-date"
                type="week"
                value={form.dueWeek}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, dueWeek: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
              />
            )}
          </div>

          <p className="text-xs text-gray-500">
            {!form.scheduleSpecificDate && form.dueWeek
              ? "Week-based tasks are scheduled for Friday of the selected week."
              : "Choose a specific calendar date or plan the task by week number."}
          </p>

          <button
            type="submit"
            disabled={isCreating}
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isCreating ? "Saving..." : "Add task"}
          </button>
        </form>
      </section>

      {extraContent}

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Tasks</h2>
            <p className="mt-1 text-sm text-gray-600">
              Organize FollowUps and action items.
            </p>
          </div>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </span>
        </div>

        {tasks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
            <h3 className="text-base font-medium">No tasks yet</h3>
            <p className="mt-2 text-sm text-gray-600">
              Add your first action item for this application.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {tasks.map((task) => {
              const isEditing = editingTaskId === task.id;
              const isDeleting = deletingTaskId === task.id;

              return (
                <article
                  key={task.id}
                  className={`rounded-xl border p-4 ${
                    task.completed
                      ? "border-green-200 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor={`edit-task-title-${task.id}`}
                          className="text-sm font-medium"
                        >
                          Title *
                        </label>
                        <input
                          id={`edit-task-title-${task.id}`}
                          type="text"
                          value={editForm.title}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              title: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`edit-task-description-${task.id}`}
                          className="text-sm font-medium"
                        >
                          Description
                        </label>
                        <textarea
                          id={`edit-task-description-${task.id}`}
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                          <input
                            type="checkbox"
                            checked={editForm.scheduleSpecificDate}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                scheduleSpecificDate: e.target.checked,
                              }))
                            }
                          />
                          Schedule for specific date
                        </label>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor={`edit-task-due-date-${task.id}`}
                          className="text-sm font-medium"
                        >
                          {editForm.scheduleSpecificDate ? "Due Date" : "Due Week"}
                        </label>
                        {editForm.scheduleSpecificDate ? (
                          <input
                            id={`edit-task-due-date-${task.id}`}
                            type="date"
                            value={editForm.dueDate}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                dueDate: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          />
                        ) : (
                          <input
                            id={`edit-task-due-date-${task.id}`}
                            type="week"
                            value={editForm.dueWeek}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                dueWeek: e.target.value,
                              }))
                            }
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
                          />
                        )}
                      </div>

                      <p className="text-xs text-gray-500">
                        {!editForm.scheduleSpecificDate && editForm.dueWeek
                          ? "Week-based scheduling places the task on Friday of the selected week."
                          : "Switch between a specific date and week-based scheduling any time."}
                      </p>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(task.id)}
                          disabled={isSavingEdit}
                          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingEdit ? "Saving..." : "Save changes"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEdit}
                          disabled={isSavingEdit}
                          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3
                              className={`flex items-center gap-2 text-base font-semibold ${
                                task.completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {task.isSpecificDate ? (
                                <SpecificDateIndicator className="h-3.5 w-3.5 text-amber-500" />
                              ) : null}
                              {task.title}
                            </h3>

                            {task.completed ? (
                              <span className="rounded-full bg-white px-2 py-1 text-xs text-green-700">
                                Completed
                              </span>
                            ) : (
                              <span className="rounded-full bg-white px-2 py-1 text-xs text-gray-700">
                                Open
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-gray-500">
                            Due: {formatDate(task.dueDate)} · Updated{" "}
                            {formatDate(task.updatedAt)}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleCompleted(task)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium"
                          >
                            {task.completed ? "Mark open" : "Mark complete"}
                          </button>

                          <button
                            type="button"
                            onClick={() => startEdit(task)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            disabled={isDeleting}
                            className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {task.description ? (
                        <div
                          className={`whitespace-pre-wrap text-sm ${
                            task.completed ? "text-gray-500" : "text-gray-800"
                          }`}
                        >
                          {task.description}
                        </div>
                      ) : null}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
