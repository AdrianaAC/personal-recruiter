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
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
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
          <input
            id="dashboard-application-search"
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search applications..."
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-gray-900"
          />
        </div>
      </div>

      <ApplicationsList
        initialApplications={applications}
        className="mt-6 space-y-4"
        emptyTitle="No applications yet"
        emptyDescription="Start tracking your opportunities by creating your first application."
        emptyActionHref="/dashboard/applications/new"
        emptyActionLabel="Create first application"
        maxItems={5}
        searchQuery={deferredSearchQuery}
      />
    </section>
  );
}
