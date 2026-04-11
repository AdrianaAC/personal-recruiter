"use client";

import { useState } from "react";
import type { ApplicationStalenessLevel } from "@/lib/application-staleness";
import {
  DashboardAiFeedbackToggle,
  type DashboardVisibilityState,
} from "@/components/dashboard/dashboard-ai-feedback-toggle";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardWeeklySummary as DashboardWeeklySummarySection } from "@/components/dashboard/dashboard-weekly-summary";
import { DashboardWorkflowSettings } from "@/components/dashboard/dashboard-workflow-settings";
import { RecentApplicationsSection } from "@/components/dashboard/recent-applications-section";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";
import { RecentContactsSection } from "@/components/dashboard/recent-contacts-section";
import { RecentTasksSection } from "@/components/dashboard/recent-tasks-section";
import type { DashboardWeeklySummary } from "@/lib/dashboard-weekly-summary";

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
  iconKey: "briefcase" | "spark" | "send" | "phone";
};

type AttentionCard = {
  id: string;
  label: string;
  title: string;
  description: string;
  meta: string;
  classes: string;
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
  totalApplicationsCount: number;
  pipelineApplicationsCount: number;
  latestActivitySummaryLabel?: string | null;
  applications: Array<{
    id: string;
    companyName: string;
    roleTitle: string;
    nextStep: string | null;
    status: string;
    priority: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    staleLevel?: ApplicationStalenessLevel | null;
    staleLabel?: string | null;
    staleDescription?: string | null;
    staleWeeks?: number | null;
  }>;
  quickActionApplications: ApplicationOption[];
  quickActionContacts: QuickActionContactOption[];
  dashboardStats: DashboardStat[];
  attentionCards: AttentionCard[];
  weeklySummary: DashboardWeeklySummary;
  thankYouReminderEnabled: boolean;
  recentTasks: Array<{
    id: string;
    origin: string;
    snoozedUntil: string | Date | null;
    title: string;
    description: string | null;
    dueDate: string | Date | null;
    updatedAt?: string | Date;
    application: {
      id: string;
      companyName: string;
      roleTitle: string;
    } | null;
  }>;
  recentFollowUps: Array<{
    id: string;
    title: string;
    description: string | null;
    notes: string | null;
    scheduledAt: string | Date | null;
    updatedAt?: string | Date;
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
    default:
      return null;
  }
}

export function DashboardPageSections({
  sessionUserName,
  heroHeadline,
  heroDescription,
  totalApplicationsCount,
  pipelineApplicationsCount,
  latestActivitySummaryLabel,
  applications,
  quickActionApplications,
  quickActionContacts,
  dashboardStats,
  attentionCards,
  weeklySummary,
  thankYouReminderEnabled,
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
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50/50 to-sky-50/60 p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-slate-500">Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back{sessionUserName ? `, ${sessionUserName}` : ""}.
              </h1>
              <p className="mt-3 text-lg font-medium text-slate-800">
                {heroHeadline}
              </p>
              <p className="mt-2 text-sm text-slate-600">{heroDescription}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {totalApplicationsCount} tracked
                </span>
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {pipelineApplicationsCount} in flow
                </span>
                {latestActivitySummaryLabel ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    Latest: {latestActivitySummaryLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                <DashboardQuickActions
                  applications={quickActionApplications}
                  contacts={quickActionContacts}
                />
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 lg:w-auto lg:items-end">
              <DashboardWorkflowSettings
                thankYouReminderEnabled={thankYouReminderEnabled}
              />
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
        </div>
      </section>

      <DashboardWeeklySummarySection summary={weeklySummary} />

      {visibility.utilities ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {dashboardStats.map((stat) => (
              <div
                key={stat.label}
                className={`rounded-2xl border p-5 shadow-sm ${stat.classes}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">
                      {stat.label}
                    </p>
                    <p className="mt-3 text-3xl font-semibold text-slate-950">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {stat.subtitle}
                    </p>
                  </div>

                  <div
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${stat.iconClasses}`}
                  >
                    {renderStatIcon(stat.iconKey)}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {attentionCards.length > 0 ? (
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Needs Attention
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    The next things worth touching before they get lost.
                  </p>
                </div>

                <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  {attentionCards.length} priorities
                </span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                {attentionCards.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-4 shadow-sm ${item.classes}`}
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                      {item.label}
                    </p>
                    <h3 className="mt-2 text-base font-semibold text-slate-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.description}
                    </p>
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {item.meta}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </>
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

      {visibility.timeline ? (
        <DashboardActivityTimeline items={timelineItems} />
      ) : null}
    </div>
  );
}
