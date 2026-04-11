"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DashboardTimelineItem = {
  id: string;
  kind: "application" | "task" | "call-up";
  title: string;
  description: string;
  timestamp: string | Date;
  meta?: string | null;
  href?: string | null;
};

type DashboardActivityTimelineProps = {
  items: DashboardTimelineItem[];
};

function formatTimelineDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function truncateTimelineDescription(value: string) {
  return value.trim();
}

function getKindLabel(kind: DashboardTimelineItem["kind"]) {
  switch (kind) {
    case "application":
      return "Application";
    case "task":
      return "Task";
    case "call-up":
      return "FollowUp";
    default:
      return "Activity";
  }
}

function getKindClasses(kind: DashboardTimelineItem["kind"]) {
  switch (kind) {
    case "application":
      return "bg-emerald-100 text-emerald-900 ring-emerald-200";
    case "task":
      return "bg-amber-100 text-amber-900 ring-amber-200";
    case "call-up":
      return "bg-sky-100 text-sky-900 ring-sky-200";
    default:
      return "bg-white text-slate-700 ring-slate-200";
  }
}

function getKindAccentClasses(kind: DashboardTimelineItem["kind"]) {
  switch (kind) {
    case "application":
      return {
        node: "border-emerald-300 bg-emerald-500",
        connector: "bg-emerald-200",
        card: "border-emerald-200 bg-white",
        glow: "from-emerald-100/80 via-transparent to-transparent",
      };
    case "task":
      return {
        node: "border-amber-300 bg-amber-500",
        connector: "bg-amber-200",
        card: "border-amber-200 bg-white",
        glow: "from-amber-100/80 via-transparent to-transparent",
      };
    case "call-up":
      return {
        node: "border-sky-300 bg-sky-500",
        connector: "bg-sky-200",
        card: "border-sky-200 bg-white",
        glow: "from-sky-100/80 via-transparent to-transparent",
      };
    default:
      return {
        node: "border-slate-300 bg-slate-400",
        connector: "bg-slate-200",
        card: "border-slate-200 bg-white",
        glow: "from-slate-100/80 via-transparent to-transparent",
      };
  }
}

export function DashboardActivityTimeline({
  items,
}: DashboardActivityTimelineProps) {
  const [filter, setFilter] = useState<"all" | "application" | "task" | "call-up">(
    "all",
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") {
      return items;
    }

    return items.filter((item) => item.kind === filter);
  }, [filter, items]);

  return (
    <section className="rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-100 via-white to-slate-50 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Timeline</h2>
          <p className="mt-1 text-sm text-slate-600">
            A combined stream of your latest applications, tasks, and FollowUps.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {[
            { key: "all", label: "All" },
            { key: "application", label: "Applications" },
            { key: "task", label: "Tasks" },
            { key: "call-up", label: "FollowUps" },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setFilter(option.key as "all" | "application" | "task" | "call-up")
              }
              className={`rounded-full px-3 py-1 text-xs font-medium ring-1 transition ${
                filter === option.key
                  ? "bg-slate-950 text-white ring-slate-950"
                  : "bg-slate-100 text-slate-700 ring-slate-300 hover:bg-slate-200"
              }`}
            >
              {option.label}
            </button>
          ))}

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-900 ring-1 ring-slate-300">
            {filteredItems.length} shown
          </span>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-400 bg-slate-50/70 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">No activity yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            No events match the current timeline filter.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto pb-3">
          <div className="relative min-w-max px-2 pt-2">
            <div className="absolute left-10 right-10 top-6 h-px bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200" />

            <div className="absolute left-10 right-10 top-[21px] h-[10px] bg-[radial-gradient(circle,_rgba(148,163,184,0.22)_1px,_transparent_1px)] bg-[length:18px_10px] opacity-80" />

            <div className="flex items-start gap-4 pt-10">
              {filteredItems.map((item) => {
                const accents = getKindAccentClasses(item.kind);

                return (
                  <div key={item.id} className="relative w-56 shrink-0">
                    <div
                      className={`pointer-events-none absolute inset-x-1 top-4 h-16 rounded-full bg-gradient-to-b ${accents.glow}`}
                    />

                    <div className="absolute left-6 top-[-1.8rem] z-10 flex flex-col items-center">
                      <div
                        className={`h-4 w-4 rounded-full border-2 shadow-sm ${accents.node}`}
                      />
                      <div className={`mt-1 h-6 w-px ${accents.connector}`} />
                    </div>

                    <div
                      className={`rounded-[1.2rem] border p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${accents.card}`}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${getKindClasses(item.kind)}`}
                        >
                          {getKindLabel(item.kind)}
                        </span>

                        <span className="text-xs text-slate-500">
                          {formatTimelineDate(item.timestamp)}
                        </span>
                      </div>

                      <h3 className="mt-2 text-sm font-semibold text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-1 line-clamp-3 min-h-[3.75rem] text-[13px] leading-5 text-slate-600">
                        {truncateTimelineDescription(item.description)}
                      </p>

                      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                        {item.meta ? (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800 ring-1 ring-slate-300">
                            {item.meta}
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 ring-1 ring-slate-300">
                            Recent activity
                          </span>
                        )}

                        {item.href ? (
                          <Link
                            href={item.href}
                            className="inline-flex rounded-full border border-slate-300 bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-800 transition hover:bg-slate-200"
                          >
                            Open details
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
