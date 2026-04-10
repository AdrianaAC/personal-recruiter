"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export type ApplicationListItem = {
  id: string;
  companyName: string;
  roleTitle: string;
  location?: string | null;
  workMode?: string | null;
  nextStep?: string | null;
  status: string;
  priority: string;
  jobUrl?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
};

type ApplicationsListProps = {
  initialApplications: ApplicationListItem[];
  emptyTitle: string;
  emptyDescription: string;
  emptyActionHref: string;
  emptyActionLabel: string;
  className?: string;
  maxItems?: number;
  itemsPerPage?: number;
  searchQuery?: string;
  emphasizeDashboard?: boolean;
  showSupplementalTags?: boolean;
  showJobPostAction?: boolean;
  showDeleteAction?: boolean;
  showEditAction?: boolean;
  showArchiveAction?: boolean;
  showCopyAction?: boolean;
  dateTagMode?: "created" | "updated";
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getPriorityTagClass(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-50 text-red-700 ring-1 ring-red-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
    case "LOW":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusTagClass(status: string) {
  switch (status) {
    case "SAVED":
      return "bg-white text-gray-700 ring-1 ring-gray-300";
    case "APPLIED":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-300";
    case "SCREENING":
      return "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300";
    case "TECHNICAL_INTERVIEW":
      return "bg-fuchsia-100 text-fuchsia-900 ring-1 ring-fuchsia-300";
    case "TAKE_HOME":
      return "bg-amber-100 text-amber-900 ring-1 ring-amber-300";
    case "FINAL_INTERVIEW":
      return "bg-violet-100 text-violet-900 ring-1 ring-violet-300";
    case "OFFER":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300";
    case "REJECTED":
      return "bg-rose-100 text-rose-900 ring-1 ring-rose-300";
    case "WITHDRAWN":
      return "bg-slate-200 text-slate-900 ring-1 ring-slate-400";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getStatusAccentClass(status: string) {
  switch (status) {
    case "APPLIED":
      return "bg-sky-400";
    case "SCREENING":
      return "bg-cyan-400";
    case "TECHNICAL_INTERVIEW":
      return "bg-fuchsia-400";
    case "TAKE_HOME":
      return "bg-amber-400";
    case "FINAL_INTERVIEW":
      return "bg-violet-400";
    case "OFFER":
      return "bg-emerald-400";
    case "REJECTED":
      return "bg-rose-400";
    case "WITHDRAWN":
      return "bg-slate-400";
    default:
      return "bg-gray-300";
  }
}

function formatRelativeDate(value: string | Date) {
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

function TrashIcon() {
  return (
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
  );
}

function PencilIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path
        d="M4 20l4.5-1 9-9a2.1 2.1 0 0 0-3-3l-9 9L4 20Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M13.5 6.5l4 4" strokeLinecap="round" />
    </svg>
  );
}

function CopyIcon() {
  return (
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
  );
}

function ArchiveIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-4 w-4"
    >
      <path
        d="M4 7.5h16"
        strokeLinecap="round"
      />
      <path
        d="M6 7.5h12v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-10Z"
        strokeLinejoin="round"
      />
      <path d="M9 12h6" strokeLinecap="round" />
      <path
        d="M5 4.5h14a1 1 0 0 1 1 1v2H4v-2a1 1 0 0 1 1-1Z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function actionKey(id: string, action: "archive" | "copy" | "delete") {
  return `${id}:${action}`;
}

function getActivityCopy(application: ApplicationListItem) {
  if (application.nextStep) {
    return `Next up: ${application.nextStep}`;
  }

  switch (application.status) {
    case "SAVED":
      return "Next up: define your first outreach or application step.";
    case "APPLIED":
      return "Next up: set a FollowUp reminder while you wait.";
    case "SCREENING":
    case "TECHNICAL_INTERVIEW":
    case "TAKE_HOME":
    case "FINAL_INTERVIEW":
      return "Next up: keep prep notes, contacts, and FollowUps moving.";
    case "OFFER":
      return "Next up: capture offer details and your decision notes.";
    case "REJECTED":
      return "Next up: save takeaways for the next opportunity.";
    case "WITHDRAWN":
      return "Next up: keep the context for future applications.";
    default:
      return "Next up: keep the application moving forward.";
  }
}

function matchesApplication(
  application: ApplicationListItem,
  normalizedQuery: string,
) {
  if (!normalizedQuery) {
    return true;
  }

  const searchableFields = [
    application.companyName,
    application.roleTitle,
    application.location ?? "",
    application.workMode ? formatLabel(application.workMode) : "",
    application.nextStep ?? "",
    application.status,
    formatLabel(application.status),
    application.priority,
    formatLabel(application.priority),
    application.jobUrl ?? "",
    new Date(application.createdAt).toLocaleDateString(),
    application.updatedAt
      ? new Date(application.updatedAt).toLocaleDateString()
      : "",
  ];

  return searchableFields.some((field) =>
    field.toLowerCase().includes(normalizedQuery),
  );
}

function getDisplayDate(
  application: ApplicationListItem,
  dateTagMode: "created" | "updated",
) {
  return dateTagMode === "updated"
    ? application.updatedAt ?? application.createdAt
    : application.createdAt;
}

export function ApplicationsList({
  initialApplications,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
  className,
  maxItems,
  itemsPerPage,
  searchQuery,
  emphasizeDashboard = false,
  showSupplementalTags = false,
  showJobPostAction = false,
  showDeleteAction = true,
  showEditAction = true,
  showArchiveAction = true,
  showCopyAction = true,
  dateTagMode = "created",
}: ApplicationsListProps) {
  const router = useRouter();
  const [applications, setApplications] =
    useState<ApplicationListItem[]>(initialApplications);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const normalizedQuery = searchQuery?.trim().toLowerCase() ?? "";
  const shouldPaginate =
    typeof itemsPerPage === "number" && Number.isFinite(itemsPerPage) && itemsPerPage > 0;

  const filteredApplications = useMemo(() => {
    return applications.filter((application) =>
      matchesApplication(application, normalizedQuery),
    );
  }, [applications, normalizedQuery]);

  const totalPages = shouldPaginate
    ? Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage))
    : 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [normalizedQuery, itemsPerPage]);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const visibleApplications = useMemo(() => {
    if (shouldPaginate) {
      const pageStart = (currentPage - 1) * itemsPerPage;
      return filteredApplications.slice(pageStart, pageStart + itemsPerPage);
    }

    if (!normalizedQuery && typeof maxItems === "number") {
      return filteredApplications.slice(0, maxItems);
    }

    return filteredApplications;
  }, [
    currentPage,
    filteredApplications,
    itemsPerPage,
    maxItems,
    normalizedQuery,
    shouldPaginate,
  ]);
  const displayedItemCount = shouldPaginate
    ? Math.min(currentPage * itemsPerPage, filteredApplications.length)
    : visibleApplications.length;

  async function handleDelete(application: ApplicationListItem) {
    const confirmed = window.confirm(
      `Delete ${application.companyName} - ${application.roleTitle}?`,
    );

    if (!confirmed) {
      return;
    }

    const key = actionKey(application.id, "delete");
    const previousApplications = applications;

    setError(null);
    setActiveAction(key);
    setApplications((prev) => prev.filter((item) => item.id !== application.id));

    try {
      const response = await fetch(`/api/applications/${application.id}`, {
        method: "DELETE",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to delete application.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setApplications(previousApplications);
      setError(
        err instanceof Error ? err.message : "Failed to delete application.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCopy(application: ApplicationListItem) {
    const key = actionKey(application.id, "copy");

    setError(null);
    setActiveAction(key);

    try {
      const response = await fetch(
        `/api/applications/${application.id}/duplicate`,
        {
          method: "POST",
        },
      );

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to duplicate application.");
      }

      setApplications((prev) => {
        const next = [result, ...prev];
        return !shouldPaginate && typeof maxItems === "number"
          ? next.slice(0, maxItems)
          : next;
      });

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to duplicate application.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleArchive(application: ApplicationListItem) {
    const confirmed = window.confirm(
      `Archive ${application.companyName} - ${application.roleTitle}?`,
    );

    if (!confirmed) {
      return;
    }

    const key = actionKey(application.id, "archive");
    const previousApplications = applications;

    setError(null);
    setActiveAction(key);
    setApplications((prev) => prev.filter((item) => item.id !== application.id));

    try {
      const response = await fetch(`/api/applications/${application.id}/archive`, {
        method: "POST",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.error || "Failed to archive application.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      setApplications(previousApplications);
      setError(
        err instanceof Error ? err.message : "Failed to archive application.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-lg font-medium">{emptyTitle}</h2>
        <p className="mt-2 text-sm text-gray-600">{emptyDescription}</p>

        <Link
          href={emptyActionHref}
          className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          {emptyActionLabel}
        </Link>
      </div>
    );
  }

  return (
    <div className={className ?? "space-y-4"}>
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {visibleApplications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <h3 className="text-lg font-medium">No matching applications</h3>
          <p className="mt-2 text-sm text-gray-600">
            Try a different keyword to find the application you want.
          </p>
        </div>
      ) : null}

      {visibleApplications.map((application) => {
        const isDeleting = activeAction === actionKey(application.id, "delete");
        const isArchiving = activeAction === actionKey(application.id, "archive");
        const isCopying = activeAction === actionKey(application.id, "copy");
        const isBusy = isDeleting || isArchiving || isCopying;

        return (
          <div
            key={application.id}
            className={`${
              emphasizeDashboard
                ? "relative overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-r from-white via-emerald-50/30 to-white p-5 shadow-md transition hover:border-emerald-300 hover:shadow-lg"
                : "rounded-xl border border-gray-200 bg-white p-4 shadow-md transition hover:border-gray-300 hover:shadow-lg"
            }`}
          >
            {emphasizeDashboard ? (
              <div
                className={`absolute inset-y-4 left-0 w-1.5 rounded-r-full ${getStatusAccentClass(application.status)}`}
              />
            ) : null}

            <div className="grid gap-4 lg:grid-cols-3 lg:items-center lg:gap-6">
              <Link
                href={`/dashboard/applications/${application.id}`}
                className="min-w-0 lg:justify-self-start"
              >
                <h2 className="text-lg font-semibold text-gray-900">
                  {application.companyName}
                </h2>
                <p className="text-sm text-gray-700">{application.roleTitle}</p>
                {emphasizeDashboard ? (
                  <p className="mt-2 line-clamp-2 text-xs font-medium text-slate-500">
                    {getActivityCopy(application)}
                  </p>
                ) : null}
              </Link>

              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600 lg:justify-center">
                {showSupplementalTags && application.location ? (
                  <span className="rounded-full bg-white px-2 py-1 text-gray-700 ring-1 ring-gray-300">
                    {application.location}
                  </span>
                ) : null}

                {showSupplementalTags && application.workMode ? (
                  <span className="rounded-full bg-white px-2 py-1 text-gray-700 ring-1 ring-gray-300">
                    {formatLabel(application.workMode)}
                  </span>
                ) : null}

                <span
                  className={`rounded-full px-3 py-1 font-semibold ${getStatusTagClass(application.status)}`}
                >
                  {formatLabel(application.status)}
                </span>

                <span
                  className={`rounded-full px-2 py-1 ${getPriorityTagClass(application.priority)}`}
                >
                  Priority: {formatLabel(application.priority)}
                </span>

                <span
                  className="rounded-full bg-white/80 px-2 py-1 text-slate-600 ring-1 ring-slate-200"
                  title={new Date(
                    getDisplayDate(application, dateTagMode),
                  ).toLocaleString()}
                >
                  {dateTagMode === "updated" ? "Updated" : "Added"}{" "}
                  {formatRelativeDate(getDisplayDate(application, dateTagMode))}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {showJobPostAction && application.jobUrl ? (
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center justify-center rounded-full border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                  >
                    Job post
                  </a>
                ) : null}

                {showDeleteAction || showEditAction || showArchiveAction || showCopyAction ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm">
                    {showDeleteAction ? (
                      <button
                        type="button"
                        onClick={() => handleDelete(application)}
                        disabled={isBusy}
                        aria-label={`Delete ${application.companyName}`}
                        title="Delete application"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <TrashIcon />
                      </button>
                    ) : null}

                    {showEditAction ? (
                      <Link
                        href={`/dashboard/applications/${application.id}/edit`}
                        aria-label={`Edit ${application.companyName}`}
                        title="Edit application"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-green-300 hover:bg-green-50 hover:text-green-700"
                      >
                        <PencilIcon />
                      </Link>
                    ) : null}

                    {showArchiveAction ? (
                      <button
                        type="button"
                        onClick={() => handleArchive(application)}
                        disabled={isBusy}
                        aria-label={`Archive ${application.companyName}`}
                        title="Archive application"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <ArchiveIcon />
                      </button>
                    ) : null}

                    {showCopyAction ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(application)}
                        disabled={isBusy}
                        aria-label={`Duplicate ${application.companyName}`}
                        title="Duplicate application"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent bg-white text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <CopyIcon />
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {shouldPaginate && filteredApplications.length > 0 ? (
        <div className="flex justify-center pt-2 text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              disabled={currentPage === 1}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-24 text-center font-medium text-slate-700">
              {displayedItemCount} of {filteredApplications.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              disabled={currentPage === totalPages}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
