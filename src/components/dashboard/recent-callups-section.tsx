"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";
import { DeleteConfirmModal } from "./delete-confirm-modal";

type RecentCallUp = {
  id: string;
  title: string;
  notes: string | null;
  scheduledAt: string | Date | null;
  updatedAt?: string | Date;
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
  countLabel?: string;
  secondaryCountLabel?: string;
  tertiaryCountLabel?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  checkboxLabel?: string;
  itemActionMode?: "complete" | "delete";
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString();
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

function CallUpCheckbox({
  callUpId,
  onAction,
  label,
  variant = "complete",
}: {
  callUpId: string;
  onAction: (callUpId: string) => Promise<void>;
  label: string;
  variant?: "complete" | "delete";
}) {
  const [loading, setLoading] = useState(false);

  async function runAction() {
    setLoading(true);
    await onAction(callUpId);
    setLoading(false);
  }

  return (
    <div
      className={
        variant === "delete"
          ? "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/90 p-1 shadow-sm"
          : ""
      }
    >
      <button
        type="button"
        onClick={() => {
          void runAction();
        }}
        disabled={loading}
        aria-label={label}
        title={label}
        className={`inline-flex items-center justify-center bg-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
          variant === "delete"
            ? "h-9 w-9 rounded-full border border-transparent text-gray-600 hover:border-red-300 hover:bg-red-50 hover:text-red-600"
            : "h-8 w-8 rounded-md border border-sky-300 text-sky-700 hover:bg-sky-50"
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

export function RecentCallUpsSection({
  callUps,
  title = "Recent FollowUps",
  description = "Recruiters, hiring managers, and contacts worth keeping warm.",
  viewHref = "/dashboard/call-ups",
  viewLabel = "View FollowUps",
  countLabel = "tracked",
  secondaryCountLabel = "linked",
  tertiaryCountLabel = "standalone",
  emptyTitle = "No FollowUps yet",
  emptyDescription = "Add FollowUps from the dashboard and attach them to a real contact.",
  checkboxLabel = "Mark FollowUp as done",
  itemActionMode = "complete",
}: RecentCallUpsSectionProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [followUpItems, setFollowUpItems] = useState(callUps);
  const [pendingDeleteFollowUp, setPendingDeleteFollowUp] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [isDeletingFollowUp, setIsDeletingFollowUp] = useState(false);
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const itemsPerPage = 5;

  useEffect(() => {
    setFollowUpItems(callUps);
  }, [callUps]);

  const filteredCallUps = useMemo(() => {
    const query = deferredSearchQuery.trim().toLowerCase();

    if (!query) {
      return followUpItems;
    }

    return followUpItems.filter((callUp) => {
      const haystack = [
        callUp.title,
        callUp.notes ?? "",
        callUp.application?.companyName ?? "",
        callUp.application?.roleTitle ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [deferredSearchQuery, followUpItems]);

  const linkedCallUpsCount = useMemo(
    () => followUpItems.filter((callUp) => callUp.application).length,
    [followUpItems],
  );
  const standaloneCallUpsCount = followUpItems.length - linkedCallUpsCount;
  const totalPages = Math.max(1, Math.ceil(filteredCallUps.length / itemsPerPage));
  const page = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage((previousPage) => Math.min(previousPage, totalPages));
  }, [totalPages]);

  const visibleCallUps = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredCallUps.slice(start, start + itemsPerPage);
  }, [filteredCallUps, page]);

  const displayedItemCount = Math.min(page * itemsPerPage, filteredCallUps.length);

  async function handleCompleteFollowUp(callUpId: string) {
    const previousFollowUps = followUpItems;

    setFollowUpItems((currentFollowUps) =>
      currentFollowUps.filter((callUp) => callUp.id !== callUpId),
    );

    try {
      const res = await fetch(`/api/call-ups/${callUpId}`, {
        method: "PATCH",
      });

      if (!res.ok) {
        throw new Error("Failed to update FollowUp.");
      }

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFollowUpItems(previousFollowUps);
      alert("Failed to update FollowUp.");
    }
  }

  async function handleDeleteFollowUp(callUpId: string) {
    const followUpToDelete = followUpItems.find((callUp) => callUp.id === callUpId);
    if (!followUpToDelete) {
      return;
    }

    setPendingDeleteFollowUp({
      id: followUpToDelete.id,
      title: followUpToDelete.title,
    });
  }

  async function confirmDeleteFollowUp() {
    if (!pendingDeleteFollowUp) {
      return;
    }

    const previousFollowUps = followUpItems;
    setIsDeletingFollowUp(true);

    setFollowUpItems((currentFollowUps) =>
      currentFollowUps.filter((callUp) => callUp.id !== pendingDeleteFollowUp.id),
    );

    try {
      const res = await fetch(`/api/call-ups/${pendingDeleteFollowUp.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete FollowUp.");
      }

      setPendingDeleteFollowUp(null);

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setFollowUpItems(previousFollowUps);
      alert("Failed to delete FollowUp.");
    } finally {
      setIsDeletingFollowUp(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-3xl border-[3px] border-sky-400 bg-gradient-to-br from-sky-100 via-sky-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-600">{description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {viewHref ? (
            <Link
              href={viewHref}
              className="inline-flex items-center rounded-full border border-sky-200 bg-white px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-50"
            >
              {viewLabel}
            </Link>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {followUpItems.length} {countLabel}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {linkedCallUpsCount} {secondaryCountLabel}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
            {standaloneCallUpsCount} {tertiaryCountLabel}
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
            {followUpItems.length === 0 ? emptyTitle : "No matching FollowUps"}
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            {followUpItems.length === 0
              ? emptyDescription
              : "Try a different search to find the FollowUp you want."}
          </p>
        </div>
      ) : (
        <div className="mt-6 mb-4 flex-1 space-y-4">
          {visibleCallUps.map((callUp) => (
            <div
              key={callUp.id}
              className="min-h-[124px] rounded-2xl border border-sky-200 bg-gradient-to-r from-white via-sky-50/40 to-white px-4 py-3 shadow-md transition hover:shadow-lg"
            >
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_auto_auto] lg:items-center lg:gap-4">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-slate-900">
                    {callUp.title}
                  </h3>

                  <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
                    <span>{formatDate(callUp.scheduledAt)}</span>
                    <span
                      aria-hidden="true"
                      className="text-base leading-none text-sky-500"
                    >
                      ●
                    </span>
                    <span>{callUp.notes ?? "No description"}</span>
                  </div>

                  <p
                    className="mt-3 truncate whitespace-nowrap text-sm text-slate-500"
                    title={
                      callUp.application
                        ? `${callUp.application.companyName} · ${callUp.application.roleTitle}`
                        : "Standalone FollowUp"
                    }
                  >
                    {callUp.application
                      ? `${callUp.application.companyName} · ${callUp.application.roleTitle}`
                      : "Standalone FollowUp"}
                  </p>
                </div>

                <div className="flex flex-nowrap items-center justify-center gap-1 self-center text-[10px] leading-none lg:-translate-x-2">
                  {callUp.application ? (
                    <Link
                      href={`/dashboard/applications/${callUp.application.id}`}
                      className="inline-flex items-center whitespace-nowrap rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-900 ring-1 ring-emerald-300 transition hover:bg-emerald-200"
                    >
                      Open application
                    </Link>
                  ) : (
                    <span className="inline-flex items-center whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 ring-1 ring-slate-300">
                      General FollowUp
                    </span>
                  )}

                  <span
                    className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 font-semibold ring-1 ${
                      itemActionMode === "delete"
                        ? "bg-rose-100 text-rose-900 ring-rose-300"
                        : "bg-sky-100 text-sky-900 ring-sky-300"
                    }`}
                  >
                    {itemActionMode === "delete" ? "Closed" : "Planned"}
                  </span>

                  <span
                    className="inline-flex items-center whitespace-nowrap rounded-full bg-white px-2 py-0.5 font-medium text-slate-600 ring-1 ring-slate-200"
                    title={callUp.updatedAt ? new Date(callUp.updatedAt).toLocaleString() : undefined}
                  >
                    Updated {formatRelativeDate(callUp.updatedAt ?? callUp.scheduledAt)}
                  </span>
                </div>

                <div className="flex justify-end">
                  <CallUpCheckbox
                    callUpId={callUp.id}
                    onAction={
                      itemActionMode === "delete"
                        ? handleDeleteFollowUp
                        : handleCompleteFollowUp
                    }
                    label={
                      itemActionMode === "delete"
                        ? "Delete FollowUp"
                        : checkboxLabel
                    }
                    variant={itemActionMode}
                  />
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
              onClick={() => setCurrentPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>

            <span className="min-w-24 text-center font-medium text-slate-700">
              {displayedItemCount} of {filteredCallUps.length}
            </span>

            <button
              type="button"
              onClick={() =>
                setCurrentPage((current) => Math.min(totalPages, current + 1))
              }
              disabled={page === totalPages}
              className="inline-flex h-9 items-center justify-center rounded-full border border-slate-300 bg-white px-4 font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <DeleteConfirmModal
        open={pendingDeleteFollowUp !== null}
        itemLabel={pendingDeleteFollowUp?.title ?? "this FollowUp"}
        itemType="FollowUp"
        onCancel={() => {
          if (!isDeletingFollowUp) {
            setPendingDeleteFollowUp(null);
          }
        }}
        onConfirm={confirmDeleteFollowUp}
        busy={isDeletingFollowUp}
      />
    </section>
  );
}
