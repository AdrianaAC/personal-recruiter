"use client";

import type { DashboardWeeklySummary } from "@/lib/dashboard-weekly-summary";

type DashboardWeeklySummaryProps = {
  summary: DashboardWeeklySummary;
};

export function DashboardWeeklySummary({
  summary,
}: DashboardWeeklySummaryProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-200/80">
            Homepage Widget
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            {summary.title}
          </h2>
          <p className="mt-2 text-sm text-slate-300">{summary.description}</p>
        </div>

        <p className="max-w-xl text-sm text-slate-300">
          The handful of things that matter this week, so you can start the
          session with direction instead of scanning the whole board.
        </p>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {summary.items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
              {item.label}
            </p>
            <p className="mt-3 text-3xl font-semibold text-white">
              {item.value}
            </p>
            <p className="mt-2 text-sm text-slate-300">{item.helper}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
