"use client";

import Link from "next/link";
import { useDeferredValue, useMemo, useState } from "react";
import {
  ApplicationsList,
  type ApplicationListItem,
} from "@/components/applications/applications-list";

type RecentApplicationsSectionProps = {
  applications: ApplicationListItem[];
  title?: string;
  description?: string;
  viewHref?: string | null;
  viewLabel?: string;
  summaryChips?: Array<{
    label: string;
    value: number;
  }>;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyActionHref?: string;
  emptyActionLabel?: string;
  showDeleteAction?: boolean;
  showEditAction?: boolean;
  showArchiveAction?: boolean;
  showCopyAction?: boolean;
  dateTagMode?: "created" | "updated";
};

export function RecentApplicationsSection({
  applications,
  title = "Recent Applications",
  description = "Your latest opportunities at a glance.",
  viewHref = "/dashboard/applications",
  viewLabel = "View applications",
  summaryChips,
  emptyTitle = "No applications yet",
  emptyDescription = "Start tracking your opportunities by creating your first application.",
  emptyActionHref = "/dashboard/applications/new",
  emptyActionLabel = "Create first application",
  showDeleteAction = true,
  showEditAction = true,
  showArchiveAction = true,
  showCopyAction = true,
  dateTagMode = "updated",
}: RecentApplicationsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const missingNextStepCount = useMemo(
    () =>
      applications.filter(
        (item) =>
          item.missingNextStepDetected || !item.nextStep?.trim(),
      ).length,
    [applications],
  );
  const activeCount = useMemo(
    () => applications.filter((item) => item.status !== "SAVED").length,
    [applications],
  );
  const needsAttentionCount = useMemo(
    () => applications.filter((item) => item.staleLevel !== null && item.staleLevel !== undefined).length,
    [applications],
  );
  const probablyInactiveCount = useMemo(
    () =>
      applications.filter(
        (item) => item.staleLevel === "stale" || item.staleLevel === "archive",
      ).length,
    [applications],
  );
  const archiveSuggestionCount = useMemo(
    () => applications.filter((item) => item.staleLevel === "archive").length,
    [applications],
  );
  const resolvedSummaryChips = useMemo(
    () =>
      summaryChips ?? [
        { value: applications.length, label: "tracked here" },
        needsAttentionCount > 0
          ? { value: needsAttentionCount, label: "need attention" }
          : { value: activeCount, label: "active" },
        probablyInactiveCount > 0
          ? { value: probablyInactiveCount, label: "probably inactive" }
          : { value: missingNextStepCount, label: "missing next step" },
        ...(archiveSuggestionCount > 0
          ? [{ value: archiveSuggestionCount, label: "suggest archive" }]
          : []),
      ],
    [
      activeCount,
      applications.length,
      archiveSuggestionCount,
      missingNextStepCount,
      needsAttentionCount,
      probablyInactiveCount,
      summaryChips,
    ],
  );

  return (
    <section className="rounded-3xl border-[3px] border-emerald-400 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-emerald-900/70">{description}</p>
            ) : null}
          </div>

          {viewHref ? (
            <Link
              href={viewHref}
              className="inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-50"
            >
              {viewLabel}
            </Link>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-2">
            {resolvedSummaryChips.map((chip) => (
              <span
                key={chip.label}
                className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200"
              >
                {chip.value} {chip.label}
              </span>
            ))}
          </div>

          <div className="w-full md:max-w-sm">
            <label htmlFor="dashboard-application-search" className="sr-only">
              Search applications
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
                id="dashboard-application-search"
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search applications..."
                className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <ApplicationsList
        initialApplications={applications}
        className="mt-6 space-y-4"
        emptyTitle={emptyTitle}
        emptyDescription={emptyDescription}
        emptyActionHref={emptyActionHref}
        emptyActionLabel={emptyActionLabel}
        itemsPerPage={10}
        searchQuery={deferredSearchQuery}
        emphasizeDashboard
        showDeleteAction={showDeleteAction}
        showEditAction={showEditAction}
        showArchiveAction={showArchiveAction}
        showCopyAction={showCopyAction}
        dateTagMode={dateTagMode}
      />
    </section>
  );
}
