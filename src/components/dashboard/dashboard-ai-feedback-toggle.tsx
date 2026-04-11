"use client";

export type DashboardVisibilityState = {
  utilities: boolean;
  applications: boolean;
  tasks: boolean;
  followUps: boolean;
  contacts: boolean;
  calendar: boolean;
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
  { key: "calendar", label: "Calendar" },
  { key: "timeline", label: "Timeline" },
];

const toggleThemeClasses: Record<
  keyof DashboardVisibilityState,
  {
    activeTrack: string;
    activeLabel: string;
  }
> = {
  utilities: {
    activeTrack: "border-slate-400 bg-slate-900",
    activeLabel: "text-slate-100",
  },
  applications: {
    activeTrack: "border-emerald-400 bg-emerald-500",
    activeLabel: "text-white",
  },
  tasks: {
    activeTrack: "border-amber-400 bg-amber-500",
    activeLabel: "text-white",
  },
  followUps: {
    activeTrack: "border-sky-400 bg-sky-500",
    activeLabel: "text-white",
  },
  contacts: {
    activeTrack: "border-rose-700 bg-rose-600",
    activeLabel: "text-white",
  },
  calendar: {
    activeTrack: "border-violet-400 bg-violet-500",
    activeLabel: "text-white",
  },
  timeline: {
    activeTrack: "border-slate-400 bg-slate-900",
    activeLabel: "text-slate-100",
  },
};

export function DashboardAiFeedbackToggle({
  toggles,
  onToggle,
}: DashboardAiFeedbackToggleProps) {
  return (
    <div className="inline-flex min-w-[15rem] flex-col gap-2.5 rounded-3xl border border-slate-200 bg-white/95 px-4 py-4 shadow-sm">
      {toggleItems.map((item) => {
        const enabled = toggles[item.key];
        const theme = toggleThemeClasses[item.key];

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
                  ? theme.activeTrack
                  : "border-slate-300 bg-slate-100"
              }`}
            >
              <span className="sr-only">{item.label}</span>
              <span
                className={`absolute text-[10px] font-semibold tracking-[0.04em] ${
                  enabled ? `${theme.activeLabel} left-2.5` : "right-2.5 text-slate-500"
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
