"use client";

import { useEffect, useState, type ReactNode } from "react";

type Task = {
  id: string;
  origin: string;
  snoozedUntil: string | Date | null;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
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
};

const initialFormState: TaskFormState = {
  title: "",
  description: "",
  dueDate: "",
};

function sortTasks(taskList: Task[]) {
  return [...taskList].sort((a, b) => {
    if (a.completed !== b.completed) {
      return Number(a.completed) - Number(b.completed);
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

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

function formatTaskOrigin(origin: string) {
  return origin
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTaskOriginClasses(origin: string) {
  switch (origin) {
    case "auto_followup":
      return "bg-sky-100 text-sky-900";
    case "auto_prep":
      return "bg-indigo-100 text-indigo-900";
    case "auto_deadline":
      return "bg-rose-100 text-rose-900";
    case "auto_review":
      return "bg-emerald-100 text-emerald-900";
    default:
      return "bg-white text-gray-700";
  }
}

function formatSnoozeLabel(value: string | Date | null) {
  if (!value) {
    return null;
  }

  return `Snoozed until ${new Date(value).toLocaleDateString()}`;
}

export function ApplicationTasks({
  applicationId,
  initialTasks,
  extraContent,
}: ApplicationTasksProps) {
  const [tasks, setTasks] = useState<Task[]>(() => sortTasks(initialTasks));
  const [form, setForm] = useState<TaskFormState>(initialFormState);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<TaskFormState>(initialFormState);

  const [isCreating, setIsCreating] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [snoozingTaskId, setSnoozingTaskId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(sortTasks(initialTasks));
  }, [initialTasks]);

  function startEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      dueDate: toDateInputValue(task.dueDate),
    });
    setError(null);
  }

  function cancelEdit() {
    setEditingTaskId(null);
    setEditForm(initialFormState);
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
        body: JSON.stringify(form),
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(result?.error || `Failed to create task (${response.status}).`);
        return;
      }

      setTasks((prev) => sortTasks([result, ...prev]));
      setForm(initialFormState);
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
        body: JSON.stringify(editForm),
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
      setEditForm(initialFormState);
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
        setEditForm(initialFormState);
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
            snoozedUntil: task.snoozedUntil
              ? toDateInputValue(task.snoozedUntil)
              : "",
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

  function buildSnoozeDate(weeks: number) {
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    return date.toISOString().split("T")[0];
  }

  async function handleSnoozeTask(task: Task, snoozedUntil: string) {
    setError(null);
    setSnoozingTaskId(task.id);

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
            dueDate: snoozedUntil,
            snoozedUntil,
          }),
        },
      );

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(result?.error || `Failed to snooze task (${response.status}).`);
        return;
      }

      setTasks((prev) =>
        sortTasks(
          prev.map((currentTask) =>
            currentTask.id === task.id ? result : currentTask,
          ),
        ),
      );
    } catch (err) {
      console.error(err);
      setError("Something went wrong while snoozing the task.");
    } finally {
      setSnoozingTaskId(null);
    }
  }

  async function handleCustomSnooze(task: Task) {
    const defaultDate = toDateInputValue(task.dueDate) || buildSnoozeDate(1);
    const customDate = window.prompt(
      "Enter a snooze date in YYYY-MM-DD format.",
      defaultDate,
    );

    if (!customDate) {
      return;
    }

    await handleSnoozeTask(task, customDate);
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
            <label htmlFor="task-due-date" className="text-sm font-medium">
              Due Date
            </label>
            <input
              id="task-due-date"
              type="date"
              value={form.dueDate}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, dueDate: e.target.value }))
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            />
          </div>

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
                        <label
                          htmlFor={`edit-task-due-date-${task.id}`}
                          className="text-sm font-medium"
                        >
                          Due Date
                        </label>
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
                      </div>

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
                              className={`text-base font-semibold ${
                                task.completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {task.title}
                            </h3>

                            <span
                              className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${getTaskOriginClasses(task.origin)}`}
                            >
                              {formatTaskOrigin(task.origin)}
                            </span>

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

                        {task.origin === "auto_followup" &&
                        task.snoozedUntil ? (
                          <p className="mt-2 text-xs font-medium text-sky-700">
                            {formatSnoozeLabel(task.snoozedUntil)}
                          </p>
                        ) : null}

                        <div className="flex flex-wrap gap-2">
                          {task.origin === "auto_followup" ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleSnoozeTask(task, buildSnoozeDate(1))
                                }
                                disabled={snoozingTaskId === task.id}
                                className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                1w
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleSnoozeTask(task, buildSnoozeDate(2))
                                }
                                disabled={snoozingTaskId === task.id}
                                className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                2w
                              </button>

                              <button
                                type="button"
                                onClick={() => void handleCustomSnooze(task)}
                                disabled={snoozingTaskId === task.id}
                                className="rounded-lg border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Custom
                              </button>
                            </>
                          ) : null}

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
