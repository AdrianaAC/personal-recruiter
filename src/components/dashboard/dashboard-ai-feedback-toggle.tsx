"use client";

export type DashboardVisibilityState = {
  utilities: boolean;
  applications: boolean;
  tasks: boolean;
  followUps: boolean;
  contacts: boolean;
  timeline: boolean;
};

type DashboardAiFeedbackToggleProps = {
  toggles: DashboardVisibilityState;
  onToggle: (key: keyof DashboardVisibilityState) => void;
};

const toggleItems: Array<{
  key: keyof DashboardVisibilityState;
  label: string;
}> = [
  { key: "utilities", label: "Utilities" },
  { key: "applications", label: "Applications" },
  { key: "tasks", label: "Tasks" },
  { key: "followUps", label: "FollowUps" },
  { key: "contacts", label: "Contacts" },
  { key: "timeline", label: "Timeline" },
];

export function DashboardAiFeedbackToggle({
  toggles,
  onToggle,
}: DashboardAiFeedbackToggleProps) {
  return (
    <div className="inline-flex min-w-[15rem] flex-col gap-2.5 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm">
      {toggleItems.map((item) => {
        const enabled = toggles[item.key];

        return (
          <div
            key={item.key}
            className="flex items-center justify-between gap-3"
          >
            <p className="text-sm font-semibold text-slate-900">{item.label}</p>

            <button
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`Toggle ${item.label}`}
              onClick={() => onToggle(item.key)}
              className={`relative inline-flex h-7 w-16 items-center rounded-full border transition ${
                enabled
                  ? "border-emerald-400 bg-emerald-500"
                  : "border-rose-400 bg-rose-500"
              }`}
            >
              <span className="sr-only">{item.label}</span>
              <span
                className={`absolute text-[10px] font-semibold tracking-[0.04em] text-white ${
                  enabled ? "left-2.5" : "right-2.5"
                }`}
              >
                {enabled ? "Show" : "Hide"}
              </span>
              <span
                className={`absolute left-0.5 inline-flex h-[22px] w-[22px] rounded-full bg-white shadow-sm transition-transform ${
                  enabled ? "translate-x-[34px]" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
