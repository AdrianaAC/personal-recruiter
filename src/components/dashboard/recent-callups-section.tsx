"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeferredValue, useMemo, useState } from "react";

type RecentCallUp = {
  id: string;
  title: string;
  notes: string | null;
  scheduledAt: string | Date | null;
  status: "PLANNED" | "DONE" | "MISSED";
  updatedAt: string | Date;
  contact: {
    id: string;
    fullName: string;
    email: string | null;
    linkedinUrl: string | null;
    companyName: string | null;
    jobTitle: string | null;
  } | null;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
  } | null;
};

type RecentCallUpsSectionProps = {
  callUps: RecentCallUp[];
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

function CallUpCheckbox({ callUpId }: { callUpId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);

    const res = await fetch(`/api/call-ups/${callUpId}`, {
      method: "PATCH",
    });

    setLoading(false);

    if (!res.ok) {
      alert("Failed to update FollowUp.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={markComplete}
      disabled={loading}
      aria-label="Mark FollowUp as done"
      title="Mark FollowUp as done"
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-sky-300 bg-white text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {loading ? (
        <span className="h-3 w-3 rounded-sm border border-current border-r-transparent" />
      ) : null}
    </button>
  );
}

export function RecentCallUpsSection({
  callUps,
  title = "Recent FollowUps",
  description = "Recruiters, hiring managers, and contacts worth keeping warm.",
  viewHref = "/dashboard/call-ups",
  viewLabel = "View FollowUps",
}: RecentCallUpsSectionProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const itemsPerPage = 5;
  const filteredCallUps = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return callUps;
    }

    return callUps.filter((callUp) => {
      const haystack = [
        callUp.title,
        callUp.notes ?? "",
        callUp.application?.companyName ?? "",
        callUp.application?.roleTitle ?? "",
        callUp.contact?.fullName ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [callUps, deferredSearchQuery]);
  const linkedCallUpsCount = useMemo(
    () => callUps.filter((callUp) => callUp.application).length,
    [callUps],
  );
  const plannedCallUpsCount = useMemo(
    () => callUps.filter((callUp) => callUp.status === "PLANNED").length,
    [callUps],
  );
  const totalPages = Math.max(1, Math.ceil(filteredCallUps.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);

  const visibleCallUps = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredCallUps.slice(start, start + itemsPerPage);
  }, [filteredCallUps, page]);

  return (
    <section className="flex h-full flex-col rounded-3xl border-[3px] border-sky-400 bg-gradient-to-br from-sky-100 via-sky-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {viewHref ? (
            <Link
              href={viewHref}
              className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1.5 text-xs font-medium text-sky-900 transition hover:bg-sky-50"
            >
              {viewLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {callUps.length} tracked
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {plannedCallUpsCount} planned
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {linkedCallUpsCount} linked
          </span>
        </div>

        <div className="w-full md:max-w-[12rem]">
          <label htmlFor="dashboard-callup-search" className="sr-only">
            Search FollowUps
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
              id="dashboard-callup-search"
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search FollowUps..."
              className="w-full border-0 bg-transparent text-sm text-gray-900 outline-none"
            />
          </div>
        </div>
      </div>

      {filteredCallUps.length === 0 ? (
        <div className="mt-6 flex-1 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">
            {callUps.length === 0 ? "No FollowUps yet" : "No matching FollowUps"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {callUps.length === 0
              ? "Add FollowUps from the dashboard and attach them to a real contact."
              : "Try a different search to find the FollowUp you want."}
          </p>
        </div>
      ) : (
        <div className="mt-6 mb-4 flex-1 space-y-4">
          {visibleCallUps.map((callUp) => (
            <div
              key={callUp.id}
              className="rounded-2xl border border-sky-200 bg-white/95 p-4 shadow-md transition hover:shadow-lg"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {callUp.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {formatDate(callUp.scheduledAt)}
                    </p>
                  </div>

                  <CallUpCheckbox callUpId={callUp.id} />
                </div>

                {callUp.notes ? (
                  <p className="text-sm text-slate-600">{callUp.notes}</p>
                ) : null}

                <div className="flex items-center justify-between gap-4 pt-1">
                  {callUp.application ? (
                    <>
                      <p className="text-sm text-slate-500">
                        {callUp.application.companyName} · {callUp.application.roleTitle}
                      </p>

                      <Link
                        href={`/dashboard/applications/${callUp.application.id}`}
                        className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Open application
                      </Link>
                    </>
                  ) : (
                    <span className="text-sm text-slate-500">
                      General FollowUp
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCallUps.length > 0 ? (
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
