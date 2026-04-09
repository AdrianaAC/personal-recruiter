"use client";

import { useState } from "react";

export function DashboardAiFeedbackToggle() {
  const [toggles, setToggles] = useState({
    dashboard: false,
    applications: false,
    tasks: false,
    followUps: false,
  });

  const toggleItems = [
    { key: "dashboard", label: "AI Dashboard" },
    { key: "applications", label: "AI Applications" },
    { key: "tasks", label: "AI Tasks" },
    { key: "followUps", label: "AI FollowUps" },
  ] as const;

  return (
    <div className="inline-flex min-w-[18rem] flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 px-5 py-5 shadow-sm">
      {toggleItems.map((item) => {
        const enabled = toggles[item.key];

        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-4"
          >
            <p className="text-base font-semibold text-slate-900">
              {item.label}
            </p>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`Toggle ${item.label}`}
              onClick={() =>
                setToggles((current) => ({
                  ...current,
                  [item.key]: !current[item.key],
                }))
              }
              className={`relative inline-flex h-10 w-20 items-center rounded-full border transition ${
                enabled
                  ? "border-emerald-400 bg-emerald-500"
                  : "border-rose-400 bg-rose-500"
              }`}
            >
              <span className="sr-only">{item.label}</span>
              <span
                className={`absolute text-xs font-semibold uppercase tracking-[0.08em] text-white ${
                  enabled ? "left-3" : "right-3"
                }`}
              >
                {enabled ? "On" : "Off"}
              </span>
              <span
                className={`absolute left-1 inline-flex h-8 w-8 rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "translate-x-10" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
