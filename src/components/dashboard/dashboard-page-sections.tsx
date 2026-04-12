"use client";

import { useState } from "react";
import {
  DashboardAiFeedbackToggle,
  type DashboardVisibilityState,
} from "@/components/dashboard/dashboard-ai-feedback-toggle";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { DashboardCalendarSection } from "@/components/dashboard/dashboard-calendar-section";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { RecentApplicationsSection } from "@/components/dashboard/recent-applications-section";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";
import { RecentContactsSection } from "@/components/dashboard/recent-contacts-section";
import { RecentTasksSection } from "@/components/dashboard/recent-tasks-section";

type ApplicationOption = {
  id: string;
  companyName: string;
  roleTitle: string;
};

type QuickActionContactOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobTitle: string | null;
};

type DashboardStat = {
  label: string;
  value: number;
  subtitle: string;
  classes: string;
  iconClasses: string;
  labelClasses?: string;
  subtitleClasses?: string;
  iconKey: "briefcase" | "spark" | "send" | "phone" | "user";
};

type AttentionCard = {
  id: string;
  label: string;
  title: string;
  description: string;
  meta: string;
  classes: string;
  labelClasses?: string;
  metaClasses?: string;
};

type TimelineItem = {
  id: string;
  kind: "application" | "task" | "call-up";
  title: string;
  description: string;
  timestamp: string | Date;
  meta?: string | null;
  href?: string | null;
};

type ContactSectionItem = {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  linkedinUrl: string | null;
  companyName: string | null;
  jobTitle: string | null;
  notes?: string | null;
  updatedAt: string | Date;
  applicationLinksCount: number;
  applications?: Array<{
    application: {
      id?: string;
      companyName: string;
      roleTitle: string;
    };
  }>;
};

type DashboardPageSectionsProps = {
  sessionUserName?: string | null;
  heroHeadline: string;
  heroDescription: string;
  applications: Array<{
    id: string;
    companyName: string;
    roleTitle: string;
    nextStep: string | null;
    status: string;
    priority: string;
    createdAt: string | Date;
    updatedAt: string | Date;
  }>;
  quickActionApplications: ApplicationOption[];
  quickActionContacts: QuickActionContactOption[];
  dashboardStats: DashboardStat[];
  weeklyTodoLabel: string;
  weeklyTodoCards: DashboardStat[];
  attentionCards: AttentionCard[];
  calendarEvents: Array<{
    id: string;
    type: "task" | "interview" | "followup";
    title: string;
    startsAt: string | Date;
    isSpecificDate?: boolean;
    href?: string | null;
    meta?: string | null;
  }>;
  recentTasks: Array<{
    id: string;
    title: string;
    description: string | null;
    dueDate: string | Date | null;
    isSpecificDate?: boolean;
    updatedAt?: string | Date;
    href?: string | null;
    application: {
      id: string;
      companyName: string;
      roleTitle: string;
    } | null;
  }>;
  recentFollowUps: Array<{
    id: string;
    title: string;
    description?: string | null;
    notes: string | null;
    scheduledAt: string | Date | null;
    isSpecificDate?: boolean;
    updatedAt?: string | Date;
    href?: string | null;
    application: {
      id: string;
      companyName: string;
      roleTitle: string;
    } | null;
    contact?: {
      id: string;
      fullName: string;
      companyName?: string | null;
      jobTitle?: string | null;
    } | null;
  }>;
  recentContacts: ContactSectionItem[];
  timelineItems: TimelineItem[];
};

const initialVisibilityState: DashboardVisibilityState = {
  utilities: true,
  applications: true,
  tasks: true,
  followUps: true,
  contacts: true,
  calendar: true,
  timeline: true,
};

function BriefcaseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        d="M4 9h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 13h16" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M21 3L10 14" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 3L14 21l-4-7-7-4 18-7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3v5" strokeLinecap="round" />
      <path d="m5.6 6.6 3.5 3.5" strokeLinecap="round" />
      <path d="M3 12h5" strokeLinecap="round" />
      <path d="m18.4 6.6-3.5 3.5" strokeLinecap="round" />
      <path d="m8.5 15.5 3.5-8 3.5 8-3.5 5-3.5-5Z" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        d="M7.5 4h3l1.2 3.2-1.8 1.8a15 15 0 0 0 5 5l1.8-1.8L20 13.5v3A1.5 1.5 0 0 1 18.5 18C10.5 18 6 13.5 6 5.5A1.5 1.5 0 0 1 7.5 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <circle cx="12" cy="8" r="3.25" />
      <path
        d="M5 19a7 7 0 0 1 14 0"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function renderStatIcon(iconKey: DashboardStat["iconKey"]) {
  switch (iconKey) {
    case "briefcase":
      return <BriefcaseIcon />;
    case "spark":
      return <SparkIcon />;
    case "send":
      return <SendIcon />;
    case "phone":
      return <PhoneIcon />;
    case "user":
      return <UserIcon />;
    default:
      return null;
  }
}

function MetricCard({ metric }: { metric: DashboardStat }) {
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${metric.classes}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-sm font-medium ${
              metric.labelClasses ?? "text-slate-600"
            }`}
          >
            {metric.label}
          </p>
          <p className="mt-3 text-3xl font-semibold text-slate-950">
            {metric.value}
          </p>
          <p
            className={`mt-2 text-xs ${
              metric.subtitleClasses ?? "text-slate-500"
            }`}
          >
            {metric.subtitle}
          </p>
        </div>

        <div
          className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${metric.iconClasses}`}
        >
          {renderStatIcon(metric.iconKey)}
        </div>
      </div>
    </div>
  );
}

export function DashboardPageSections({
  sessionUserName,
  heroHeadline,
  heroDescription,
  applications,
  quickActionApplications,
  quickActionContacts,
  dashboardStats,
  weeklyTodoLabel,
  weeklyTodoCards,
  attentionCards,
  calendarEvents,
  recentTasks,
  recentFollowUps,
  recentContacts,
  timelineItems,
}: DashboardPageSectionsProps) {
  const [visibility, setVisibility] =
    useState<DashboardVisibilityState>(initialVisibilityState);

  const visibleSecondarySections = [
    visibility.tasks
      ? {
          key: "tasks",
          content: <RecentTasksSection tasks={recentTasks} />,
        }
      : null,
    visibility.followUps
      ? {
          key: "followUps",
          content: <RecentCallUpsSection callUps={recentFollowUps} />,
        }
      : null,
    visibility.contacts
      ? {
          key: "contacts",
          content: (
            <RecentContactsSection
              contacts={recentContacts}
              title="Recent Contacts"
              description="The people connected to your outreach and opportunities."
              viewHref="/dashboard/call-ups"
              viewLabel="View contacts"
              enableContactEditing
            />
          ),
        }
      : null,
  ].filter((section) => section !== null);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-200 via-white to-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-stretch lg:justify-between">
            <div className="flex max-w-3xl flex-1 flex-col justify-between lg:min-h-[14rem]">
              <div className="flex flex-1 flex-col justify-center">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  Welcome back{sessionUserName ? `, ${sessionUserName}` : ""}.
                </h1>
                <p className="mt-3 text-lg font-medium text-slate-800">
                  {heroHeadline}
                </p>
                <p className="mt-2 text-sm text-slate-600">{heroDescription}</p>
              </div>

              <div className="pt-5">
                <DashboardQuickActions
                  applications={quickActionApplications}
                  contacts={quickActionContacts}
                />
              </div>
            </div>

            <div className="flex justify-start lg:justify-end">
              <DashboardAiFeedbackToggle
                toggles={visibility}
                onToggle={(key) =>
                  setVisibility((current) => ({
                    ...current,
                    [key]: !current[key],
                  }))
                }
              />
            </div>
          </div>
        </div>
      </section>

      {visibility.utilities ? (
        <section className="rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-100 via-white to-slate-50 p-5 shadow-sm">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Summary</h2>
              <p className="mt-1 text-sm text-slate-600">
                The core metrics shaping your search right now.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {dashboardStats.map((stat) => (
                  <MetricCard key={stat.label} metric={stat} />
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h2 className="text-lg font-semibold text-slate-950">
                Weekly To Do - {weeklyTodoLabel}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                What is already scheduled to happen during this week.
              </p>

              {weeklyTodoCards.length > 0 ? (
                <div className="mt-5 grid gap-4 xl:grid-cols-3">
                  {weeklyTodoCards.map((card) => (
                    <MetricCard key={card.label} metric={card} />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-600">
                  Nothing to do this week.
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Needs Attention
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    The next things worth touching before they get lost.
                  </p>
                </div>

                <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white ring-1 ring-slate-900">
                  {attentionCards.length} priorities
                </span>
              </div>

              {attentionCards.length > 0 ? (
                <div className="mt-5 grid gap-4 lg:grid-cols-3">
                  {attentionCards.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-2xl border p-4 shadow-sm ${item.classes}`}
                    >
                      <p
                        className={`text-xs font-semibold uppercase tracking-[0.12em] ${
                          item.labelClasses ?? "text-slate-500"
                        }`}
                      >
                        {item.label}
                      </p>
                      <h3 className="mt-2 text-base font-semibold text-slate-950">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600">
                        {item.description}
                      </p>
                      <p
                        className={`mt-3 text-xs font-medium ${
                          item.metaClasses ?? "text-slate-500"
                        }`}
                      >
                        {item.meta}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-slate-600">
                  Nothing urgent right now. Your board is looking tidy.
                </div>
              )}
            </div>
          </div>
        </section>
      ) : null}

      {visibility.applications ? (
        <RecentApplicationsSection
          applications={applications}
          showDeleteAction={false}
          showArchiveAction={false}
        />
      ) : null}

      {visibleSecondarySections.length === 1 ? (
        visibleSecondarySections[0].content
      ) : null}

      {visibleSecondarySections.length === 2 ? (
        <section className="grid gap-6 xl:grid-cols-2">
          {visibleSecondarySections.map((section) => (
            <div key={section.key}>{section.content}</div>
          ))}
        </section>
      ) : null}

      {visibleSecondarySections.length === 3 ? (
        <>
          <section className="grid gap-6 xl:grid-cols-2">
            <div key={visibleSecondarySections[0].key}>
              {visibleSecondarySections[0].content}
            </div>
            <div key={visibleSecondarySections[1].key}>
              {visibleSecondarySections[1].content}
            </div>
          </section>

          <div key={visibleSecondarySections[2].key}>
            {visibleSecondarySections[2].content}
          </div>
        </>
      ) : null}

      {visibility.calendar ? (
        <DashboardCalendarSection
          events={calendarEvents}
          applications={quickActionApplications}
          contacts={quickActionContacts}
        />
      ) : null}

      {visibility.timeline ? (
        <DashboardActivityTimeline items={timelineItems} />
      ) : null}
    </div>
  );
}
