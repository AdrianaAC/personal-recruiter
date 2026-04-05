"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type RecentApplication = {
  id: string;
  companyName: string;
  roleTitle: string;
  status: string;
  priority: string;
  createdAt: string | Date;
};

type RecentApplicationsProps = {
  initialApplications: RecentApplication[];
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function actionKey(id: string, action: "copy" | "delete") {
  return `${id}:${action}`;
}

export function RecentApplications({
  initialApplications,
}: RecentApplicationsProps) {
  const router = useRouter();
  const [applications, setApplications] =
    useState<RecentApplication[]>(initialApplications);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(application: RecentApplication) {
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

  async function handleCopy(application: RecentApplication) {
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

      setApplications((prev) => [result, ...prev].slice(0, 5));

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

  if (applications.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
        <h3 className="text-lg font-medium">No applications yet</h3>
        <p className="mt-2 text-sm text-gray-600">
          Start tracking your opportunities by creating your first application.
        </p>

        <Link
          href="/dashboard/applications/new"
          className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Create first application
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {applications.map((application) => {
        const isDeleting = activeAction === actionKey(application.id, "delete");
        const isCopying = activeAction === actionKey(application.id, "copy");
        const isBusy = isDeleting || isCopying;

        return (
          <div
            key={application.id}
            className="rounded-xl border border-gray-200 bg-white p-4 transition hover:border-gray-300 hover:shadow-sm"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <Link
                href={`/dashboard/applications/${application.id}`}
                className="min-w-0 flex-1"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {application.companyName}
                </h3>
                <p className="text-sm text-gray-700">{application.roleTitle}</p>
              </Link>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDelete(application)}
                    disabled={isBusy}
                    aria-label={`Delete ${application.companyName}`}
                    title="Delete application"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <TrashIcon />
                  </button>

                  <Link
                    href={`/dashboard/applications/${application.id}/edit`}
                    aria-label={`Edit ${application.companyName}`}
                    title="Edit application"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <PencilIcon />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleCopy(application)}
                    disabled={isBusy}
                    aria-label={`Duplicate ${application.companyName}`}
                    title="Duplicate application"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-gray-400 hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CopyIcon />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="rounded-full bg-gray-100 px-2 py-1">
                    {formatLabel(application.status)}
                  </span>

                  <span className="rounded-full bg-gray-100 px-2 py-1">
                    Priority: {formatLabel(application.priority)}
                  </span>

                  <span className="rounded-full bg-gray-100 px-2 py-1">
                    Added {new Date(application.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
