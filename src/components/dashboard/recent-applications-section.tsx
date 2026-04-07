"use client";

import { useDeferredValue, useState } from "react";
import {
  ApplicationsList,
  type ApplicationListItem,
} from "@/components/applications/applications-list";

type RecentApplicationsSectionProps = {
  applications: ApplicationListItem[];
};

export function RecentApplicationsSection({
  applications,
}: RecentApplicationsSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);

  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50/80 p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Recent Applications</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your latest opportunities at a glance.
          </p>
        </div>

        <div className="w-full md:max-w-xs">
          <label htmlFor="dashboard-application-search" className="sr-only">
            Search applications
          </label>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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

      <ApplicationsList
        initialApplications={applications}
        className="mt-6 space-y-4"
        emptyTitle="No applications yet"
        emptyDescription="Start tracking your opportunities by creating your first application."
        emptyActionHref="/dashboard/applications/new"
        emptyActionLabel="Create first application"
        itemsPerPage={10}
        searchQuery={deferredSearchQuery}
        emphasizeDashboard
        dateTagMode="updated"
      />
    </section>
  );
}
