"use client";

import {
  formatSundayWeekInputValue,
  getSundayWeekNumber,
  startOfSundayWeek,
} from "@/lib/scheduling";

type WeekDateInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  tone: "amber" | "sky";
};

function parseDateInputValue(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function getWeekInfo(value: string) {
  const weekStart = startOfSundayWeek(parseDateInputValue(value));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const friday = new Date(weekStart);
  friday.setDate(weekStart.getDate() + 5);

  return {
    weekStart,
    weekEnd,
    weekNumber: getSundayWeekNumber(weekStart),
    year: friday.getFullYear(),
  };
}

function formatWeekLabel(value: string) {
  const { weekNumber, year } = getWeekInfo(value);
  return `Week ${weekNumber}, ${year}`;
}

function formatWeekRange(value: string) {
  const { weekStart, weekEnd } = getWeekInfo(value);
  const startLabel = weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endLabel = weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return `${startLabel} - ${endLabel}`;
}

export function WeekDateInput({
  id,
  value,
  onChange,
  tone,
}: WeekDateInputProps) {
  const toneClasses =
    tone === "amber"
      ? {
          wrapper:
            "border-amber-300 bg-amber-50/90 text-slate-900 focus-within:border-amber-500 focus-within:bg-amber-50",
          helper: "text-amber-800/80",
          icon: "text-amber-700",
        }
      : {
          wrapper:
            "border-sky-300 bg-sky-50/90 text-slate-900 focus-within:border-sky-500 focus-within:bg-sky-50",
          helper: "text-sky-800/80",
          icon: "text-sky-700",
        };

  return (
    <div className="space-y-2">
      <div
        className={`relative overflow-hidden rounded-xl border px-3 py-2 text-sm transition ${toneClasses.wrapper}`}
      >
        <div className="flex items-center justify-between gap-3">
          <span>{value ? formatWeekLabel(value) : "Select week"}</span>

          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className={`h-4 w-4 ${toneClasses.icon}`}
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M16 3v4" strokeLinecap="round" />
            <path d="M8 3v4" strokeLinecap="round" />
            <path d="M3 9h18" strokeLinecap="round" />
          </svg>
        </div>

        <input
          id={id}
          type="date"
          value={value}
          onChange={(event) =>
            onChange(
              formatSundayWeekInputValue(parseDateInputValue(event.target.value)),
            )
          }
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </div>

      {value ? (
        <p className={`text-xs ${toneClasses.helper}`}>
          {formatWeekRange(value)}
        </p>
      ) : null}
    </div>
  );
}
