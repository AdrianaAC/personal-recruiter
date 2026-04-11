"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DashboardCallUpQuickAdd } from "@/components/dashboard/dashboard-call-up-quick-add";
import { DashboardInterviewQuickAdd } from "@/components/dashboard/dashboard-interview-quick-add";
import { DashboardTaskQuickAdd } from "@/components/dashboard/dashboard-task-quick-add";
import { SpecificDateIndicator } from "@/components/ui/specific-date-indicator";
import {
  formatDateInputValue,
  formatDateTimeInputValue,
} from "@/lib/scheduling";

type ApplicationOption = {
  id: string;
  companyName: string;
  roleTitle: string;
};

type ContactOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobTitle: string | null;
};

type CalendarEvent = {
  id: string;
  type: "task" | "interview" | "followup";
  title: string;
  startsAt: string | Date;
  isSpecificDate?: boolean;
  href?: string | null;
  meta?: string | null;
};

type DashboardCalendarSectionProps = {
  events: CalendarEvent[];
  applications: ApplicationOption[];
  contacts: ContactOption[];
};

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function endOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const currentDay = nextDate.getDay();
  const diffToMonday = (currentDay + 6) % 7;
  nextDate.setDate(nextDate.getDate() - diffToMonday);
  return nextDate;
}

function endOfWeek(date: Date) {
  return endOfDay(addDays(startOfWeek(date), 6));
}

function getIsoWeekNumber(date: Date) {
  const current = startOfDay(date);
  current.setDate(current.getDate() + 4 - (current.getDay() || 7));
  const yearStart = new Date(current.getFullYear(), 0, 1);
  return Math.ceil(
    ((current.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );
}

function formatMonthLabel(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateLabel(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getEventClasses(type: CalendarEvent["type"]) {
  switch (type) {
    case "task":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "interview":
      return "border-indigo-200 bg-indigo-50 text-indigo-900";
    case "followup":
      return "border-sky-200 bg-sky-50 text-sky-900";
  }
}

function formatEventType(type: CalendarEvent["type"]) {
  switch (type) {
    case "task":
      return "Task";
    case "interview":
      return "Interview";
    case "followup":
      return "FollowUp";
  }
}

function buildCalendarDays(currentMonth: Date) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = endOfWeek(monthEnd);
  const days: Date[] = [];

  for (
    let cursor = new Date(gridStart);
    cursor.getTime() <= gridEnd.getTime();
    cursor = addDays(cursor, 1)
  ) {
    days.push(new Date(cursor));
  }

  return days;
}

function CalendarDayEventCard({
  event,
  compact,
}: {
  event: CalendarEvent;
  compact: boolean;
}) {
  const specificDateIndicator =
    event.isSpecificDate &&
    (event.type === "task" || event.type === "followup") ? (
      <span className="mr-1 inline-flex shrink-0 align-middle">
        <SpecificDateIndicator
          className={`${
            compact ? "h-2.5 w-2.5" : "h-3 w-3"
          } ${event.type === "task" ? "text-amber-500" : "text-sky-500"}`}
        />
      </span>
    ) : null;

  const className = compact
    ? `flex min-h-0 flex-1 items-center overflow-hidden rounded-xl border px-2 py-1 text-[10px] leading-none ${getEventClasses(
        event.type,
      )}`
    : `flex h-[2.8125rem] flex-col justify-center overflow-hidden rounded-xl border px-2.5 py-2 text-[11px] leading-tight ${getEventClasses(
        event.type,
      )}`;

  const content = compact ? (
    <div className="flex min-w-0 items-center gap-1">
      <span className="shrink-0 font-semibold">
        {formatEventType(event.type)}
      </span>
      <span className="min-w-0 truncate">
        {specificDateIndicator}
        {event.title}
      </span>
    </div>
  ) : (
    <>
      <p className="font-semibold">{formatEventType(event.type)}</p>
      <p className="mt-0.5 truncate">
        {specificDateIndicator}
        {event.title}
      </p>
    </>
  );

  if (event.href) {
    return (
      <Link
        href={event.href}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
        className={className}
      >
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

function NewEventModal({
  date,
  onClose,
  onChoose,
}: {
  date: Date;
  onClose: () => void;
  onChoose: (mode: "task" | "followup" | "interview") => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-violet-200 bg-white p-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">
          Schedule Event
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          {formatDateLabel(date)}
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Choose what you want to schedule on this day.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => onChoose("task")}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            Add task
          </button>

          <button
            type="button"
            onClick={() => onChoose("interview")}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left text-sm font-semibold text-indigo-900 transition hover:bg-indigo-100"
          >
            Add interview
          </button>

          <button
            type="button"
            onClick={() => onChoose("followup")}
            className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
          >
            Add FollowUp
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export function DashboardCalendarSection({
  events,
  applications,
  contacts,
}: DashboardCalendarSectionProps) {
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [createMode, setCreateMode] = useState<
    "task" | "followup" | "interview" | null
  >(null);
  const today = startOfDay(new Date());

  const calendarDays = useMemo(
    () => buildCalendarDays(visibleMonth),
    [visibleMonth],
  );

  const eventsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    for (const event of events) {
      const eventDate = startOfDay(new Date(event.startsAt));
      const key = eventDate.toISOString();
      const dayEvents = grouped.get(key) ?? [];
      dayEvents.push(event);
      grouped.set(key, dayEvents);
    }

    for (const value of grouped.values()) {
      value.sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      );
    }

    return grouped;
  }, [events]);

  const weekRows = useMemo(() => {
    const rows: Date[][] = [];

    for (let index = 0; index < calendarDays.length; index += 7) {
      rows.push(calendarDays.slice(index, index + 7));
    }

    return rows;
  }, [calendarDays]);

  return (
    <>
      <section className="rounded-3xl border-[3px] border-violet-400 bg-gradient-to-br from-violet-100 via-violet-50 to-white p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-700">
                Calendar
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                Scheduled board
              </h2>
              <p className="mt-2 text-sm text-violet-950/70">
                See scheduled tasks, interviews, and FollowUps in one place,
                then click any day to add something new.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-violet-800 ring-1 ring-violet-200">
                Current week W{getIsoWeekNumber(today)}
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                Task
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-indigo-800 ring-1 ring-indigo-200">
                Interview
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-sky-800 ring-1 ring-sky-200">
                FollowUp
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-violet-200 bg-white/90 p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() - 1,
                        1,
                      ),
                  )
                }
                className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
              >
                Previous
              </button>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-slate-950">
                  {formatMonthLabel(visibleMonth)}
                </h3>
                <p className="mt-1 text-xs text-slate-500"></p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setVisibleMonth(
                    (current) =>
                      new Date(
                        current.getFullYear(),
                        current.getMonth() + 1,
                        1,
                      ),
                  )
                }
                className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-900 transition hover:bg-violet-100"
              >
                Next
              </button>
            </div>

            <div className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <div className="flex items-center justify-center rounded-2xl bg-violet-50 py-3 text-violet-700">
                Week
              </div>
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                (label) => (
                  <div
                    key={label}
                    className="flex items-center justify-center rounded-2xl bg-violet-50 py-3 text-violet-700"
                  >
                    {label}
                  </div>
                ),
              )}
            </div>

            <div className="mt-2 space-y-2">
              {weekRows.map((week) => {
                const weekNumber = getIsoWeekNumber(week[0]);
                const currentWeek =
                  getIsoWeekNumber(today) === weekNumber &&
                  today.getFullYear() === week[0].getFullYear();

                return (
                  <div
                    key={week[0].toISOString()}
                    className="grid grid-cols-[4.5rem_repeat(7,minmax(0,1fr))] gap-2"
                  >
                    <div
                      className={`flex min-h-[8rem] items-start justify-center rounded-2xl border px-2 py-3 text-sm font-semibold ${
                        currentWeek
                          ? "border-violet-300 bg-violet-100 text-violet-900"
                          : "border-violet-100 bg-violet-50 text-violet-700"
                      }`}
                    >
                      W{weekNumber}
                    </div>

                    {week.map((day) => {
                      const key = startOfDay(day).toISOString();
                      const dayEvents = eventsByDay.get(key) ?? [];
                      const compactEvents = dayEvents.length > 2;
                      const isToday = sameDay(day, today);
                      const inCurrentMonth =
                        day.getMonth() === visibleMonth.getMonth();

                      return (
                        <div
                          key={key}
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedDate(day);
                            setCreateMode(null);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedDate(day);
                              setCreateMode(null);
                            }
                          }}
                          className={`min-h-[8rem] rounded-2xl border p-3 text-left transition hover:border-violet-300 hover:bg-violet-50/80 focus:outline-none focus:ring-2 focus:ring-violet-300 ${
                            isToday
                              ? "border-violet-400 bg-violet-50 shadow-sm"
                              : inCurrentMonth
                                ? "border-slate-200 bg-white"
                                : "border-slate-100 bg-slate-50/80"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p
                                className={`text-sm font-semibold ${
                                  inCurrentMonth
                                    ? "text-slate-950"
                                    : "text-slate-400"
                                }`}
                              >
                                {day.getDate()}
                              </p>
                              {isToday ? (
                                <p className="mt-1 text-[11px] font-medium text-violet-700">
                                  Today
                                </p>
                              ) : null}
                            </div>

                            <span className="rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-800">
                              Add
                            </span>
                          </div>

                          <div
                            className={`mt-3 flex h-24 flex-col overflow-hidden ${
                              dayEvents.length === 1
                                ? "justify-center"
                                : "justify-start"
                            } ${compactEvents ? "gap-1" : "gap-1.5"}`}
                          >
                            {dayEvents.map((event) => (
                              <CalendarDayEventCard
                                key={event.id}
                                event={event}
                                compact={compactEvents}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {selectedDate && !createMode ? (
        <NewEventModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          onChoose={(mode) => setCreateMode(mode)}
        />
      ) : null}

      <DashboardTaskQuickAdd
        key={`task-${selectedDate ? formatDateInputValue(selectedDate) : "default"}`}
        open={createMode === "task"}
        onClose={() => {
          setCreateMode(null);
          setSelectedDate(null);
        }}
        applications={applications}
        initialDueDate={
          selectedDate ? formatDateInputValue(selectedDate) : null
        }
      />

      <DashboardCallUpQuickAdd
        key={`followup-${selectedDate ? formatDateTimeInputValue(selectedDate) : "default"}`}
        open={createMode === "followup"}
        onClose={() => {
          setCreateMode(null);
          setSelectedDate(null);
        }}
        applications={applications}
        contacts={contacts}
        initialScheduledAt={
          selectedDate ? formatDateTimeInputValue(selectedDate) : null
        }
      />

      <DashboardInterviewQuickAdd
        key={`interview-${selectedDate ? formatDateTimeInputValue(selectedDate) : "default"}`}
        open={createMode === "interview"}
        onClose={() => {
          setCreateMode(null);
          setSelectedDate(null);
        }}
        applications={applications}
        initialScheduledAt={
          selectedDate ? formatDateTimeInputValue(selectedDate) : null
        }
      />
    </>
  );
}
