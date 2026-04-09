"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

type RecentTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  updatedAt: string | Date;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
  } | null;
};

type RecentTasksSectionProps = {
  tasks: RecentTask[];
  title?: string;
  description?: string;
  viewHref?: string | null;
  viewLabel?: string;
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString();
}

function TaskCheckbox({ taskId }: { taskId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);

    const res = await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
    });

    setLoading(false);

    if (!res.ok) {
      alert("Failed to update task.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markComplete}
      disabled={loading}
      aria-label="Mark task as done"
      title="Mark task as done"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-amber-300 bg-white text-amber-700 transition hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="h-3 w-3 rounded-sm border border-current border-r-transparent" />
      ) : null}
    </button>
  );
}

export function RecentTasksSection({
  tasks,
  title = "Recent Tasks",
  description = "The action items that need your attention next.",
  viewHref = "/dashboard/tasks",
  viewLabel = "View tasks",
}: RecentTasksSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const itemsPerPage = 5;
  const filteredTasks = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => {
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
  }, [deferredSearchQuery, tasks]);
  const linkedTasksCount = useMemo(
    () => tasks.filter((task) => task.application).length,
    [tasks],
  );
  const standaloneTasksCount = tasks.length - linkedTasksCount;
  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);

  const visibleTasks = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredTasks.slice(start, start + itemsPerPage);
  }, [filteredTasks, page]);

  return (
    <section className="flex h-full flex-col rounded-3xl border-[3px] border-amber-400 bg-gradient-to-br from-amber-100 via-amber-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {viewHref ? (
            <Link
              href={viewHref}
              className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-medium text-amber-900 transition hover:bg-amber-50"
            >
              {viewLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {tasks.length} open
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {linkedTasksCount} linked
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {standaloneTasksCount} standalone
          </span>
        </div>

        <div className="w-full md:max-w-[12rem]">
          <label htmlFor="dashboard-task-search" className="sr-only">
            Search tasks
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
              id="dashboard-task-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search tasks..."
              className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
            />
          </div>
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        <div className="mt-6 flex-1 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">
            {tasks.length === 0 ? "No open tasks" : "No matching tasks"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {tasks.length === 0
              ? "Add tasks from the dashboard or attach them to applications."
              : "Try a different search to find the task you want."}
          </p>
        </div>
      ) : (
        <div className="mt-6 mb-4 flex-1 space-y-4">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-amber-200 bg-white/95 p-4 shadow-md transition hover:shadow-lg"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {task.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(task.dueDate)}
                    </p>
                  </div>

                  <TaskCheckbox taskId={task.id} />
                </div>

                {task.description ? (
                  <p className="text-sm text-slate-600">{task.description}</p>
                ) : null}

                <div className="flex items-center justify-between gap-4 pt-1">
                  <p className="text-sm text-slate-500">
                    {task.application
                      ? `${task.application.companyName} · ${task.application.roleTitle}`
                      : "Standalone task"}
                  </p>

                  {task.application ? (
                    <Link
                      href={`/dashboard/applications/${task.application.id}`}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Open application
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                      General task
                    </span>
                  )}
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
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={page === 1}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-24 text-center font-medium text-slate-700">
              {page} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={page === totalPages}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
