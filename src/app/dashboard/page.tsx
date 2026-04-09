import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentApplicationsSection } from "@/components/dashboard/recent-applications-section";
import { RecentTasksSection } from "@/components/dashboard/recent-tasks-section";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardActivityTimeline } from "@/components/dashboard/dashboard-activity-timeline";
import { DashboardAiFeedbackToggle } from "@/components/dashboard/dashboard-ai-feedback-toggle";

const RECENT_SECTION_LIMIT = 25;

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

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [
    applications,
    totalApplicationsCount,
    pipelineApplicationsCount,
    recentApplicationActivity,
    recentTaskActivity,
    recentFollowUpActivity,
    contacts,
    openTasksCount,
    callUpsCount,
    recentTasks,
    recentCallUps,
    dueSoonTask,
    nextPlannedCall,
    applicationWithoutNextStep,
  ] = await Promise.all([
    prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        nextStep: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.jobApplication.count({
      where: {
        userId: session.user.id,
      },
    }),
    prisma.jobApplication.count({
      where: {
        userId: session.user.id,
        archivedAt: null,
        status: {
          not: "SAVED",
        },
      },
    }),
    prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        archivedAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        completed: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.callUp.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        contact: {
          select: {
            id: true,
            fullName: true,
          },
        },
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.contact.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        jobTitle: true,
      },
    }),
    prisma.task.count({
      where: {
        userId: session.user.id,
        completed: false,
        archivedAt: null,
      },
    }),
    prisma.callUp.count({
      where: {
        userId: session.user.id,
        archivedAt: null,
        contactId: {
          not: null,
        },
      },
    }),
    prisma.task.findMany({
      where: {
        userId: session.user.id,
        completed: false,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
      take: RECENT_SECTION_LIMIT,
    }),
    prisma.callUp.findMany({
      where: {
        userId: session.user.id,
        archivedAt: null,
        contactId: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        notes: true,
        scheduledAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
      take: RECENT_SECTION_LIMIT,
    }),
    prisma.task.findFirst({
      where: {
        userId: session.user.id,
        completed: false,
        archivedAt: null,
        dueDate: {
          not: null,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.callUp.findFirst({
      where: {
        userId: session.user.id,
        archivedAt: null,
        status: "PLANNED",
        scheduledAt: {
          not: null,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      select: {
        id: true,
        title: true,
        scheduledAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.jobApplication.findFirst({
      where: {
        userId: session.user.id,
        archivedAt: null,
        OR: [
          {
            nextStep: null,
          },
          {
            nextStep: "",
          },
        ],
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
      },
    }),
  ]);

  const inProcessStatuses = [
    "SCREENING",
    "TECHNICAL_INTERVIEW",
    "TAKE_HOME",
    "FINAL_INTERVIEW",
  ];

  const activeApplicationsInMotionCount = applications.filter((application) =>
    inProcessStatuses.includes(application.status),
  ).length;

  const heroHeadline =
    activeApplicationsInMotionCount > 0
      ? `${activeApplicationsInMotionCount} application${
          activeApplicationsInMotionCount === 1 ? "" : "s"
        } actively moving through your pipeline.`
      : openTasksCount > 0
        ? `${openTasksCount} open task${
            openTasksCount === 1 ? "" : "s"
          } ready for your next session.`
        : totalApplicationsCount > 0
          ? "Your search board is live and ready for the next move."
          : "Build a job search board that actually feels alive.";

  const heroDescription =
    "Use the board below to spot what needs attention, keep momentum visible, and make the next move obvious.";

  const dashboardStats = [
    {
      label: "Total Applications",
      value: totalApplicationsCount,
      subtitle: "Every opportunity in your tracker.",
      classes:
        "border-slate-200 bg-gradient-to-br from-white via-white to-slate-100/80",
      iconClasses: "bg-slate-900 text-white",
      icon: <BriefcaseIcon />,
    },
    {
      label: "In Process",
      value: pipelineApplicationsCount,
      subtitle: "Active applications beyond the saved stage.",
      classes:
        "border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-white",
      iconClasses: "bg-emerald-500 text-white",
      icon: <SparkIcon />,
    },
    {
      label: "Tasks",
      value: openTasksCount,
      subtitle: "Open actions across your workflow.",
      classes:
        "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white",
      iconClasses: "bg-amber-500 text-white",
      icon: <SendIcon />,
    },
    {
      label: "FollowUps",
      value: callUpsCount,
      subtitle: "Contacts tied to active opportunities.",
      classes:
        "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white",
      iconClasses: "bg-sky-600 text-white",
      icon: <PhoneIcon />,
    },
  ];

  const allTimelineItems = [
    ...recentApplicationActivity.map((application) => ({
      id: `application-${application.id}`,
      kind: "application" as const,
      title: application.archivedAt
        ? "Application archived"
        : new Date(application.updatedAt).getTime() >
            new Date(application.createdAt).getTime()
          ? "Application updated"
          : "Application added",
      description: application.archivedAt
        ? `${application.companyName} - ${application.roleTitle} moved to archive`
        : `${application.companyName} - ${application.roleTitle}`,
      timestamp: application.updatedAt ?? application.createdAt,
      meta: application.archivedAt ? "Closed" : formatLabel(application.status),
      href: `/dashboard/applications/${application.id}`,
      summaryLabel: application.archivedAt
        ? `Archived ${application.companyName}`
        : `Updated ${application.companyName}`,
    })),
    ...recentTaskActivity.map((task) => ({
      id: `task-${task.id}`,
      kind: "task" as const,
      title: task.completed
        ? task.application
          ? "Task completed for application"
          : "Task completed"
        : task.application
          ? "Task updated for application"
          : "Task updated",
      description: task.application
        ? `${task.title} - ${task.application.companyName} - ${task.application.roleTitle}`
        : task.title,
      timestamp: task.updatedAt,
      meta: task.completed ? "Completed" : "Open",
      href: task.application
        ? `/dashboard/applications/${task.application.id}`
        : null,
      summaryLabel: task.completed ? "Completed task" : "Updated task",
    })),
    ...recentFollowUpActivity.map((callUp) => ({
      id: `call-up-${callUp.id}`,
      kind: "call-up" as const,
      title:
        callUp.status === "DONE"
          ? callUp.application
            ? "FollowUp completed"
            : "General FollowUp completed"
          : callUp.application
            ? "FollowUp logged"
            : "General FollowUp logged",
      description: callUp.contact
        ? `${callUp.title} - ${callUp.contact.fullName}`
        : callUp.title,
      timestamp: callUp.updatedAt,
      meta: formatLabel(callUp.status),
      href: callUp.application
        ? `/dashboard/applications/${callUp.application.id}`
        : null,
      summaryLabel:
        callUp.status === "DONE" ? "Completed FollowUp" : "Updated FollowUp",
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const timelineItems = allTimelineItems.slice(0, 12);
  const latestActivity = allTimelineItems[0] ?? null;

  const attentionCards = [
    dueSoonTask
      ? {
          id: "attention-task",
          label: "Due Soon",
          title: dueSoonTask.title,
          description: dueSoonTask.application
            ? `${dueSoonTask.application.companyName} · ${dueSoonTask.application.roleTitle}`
            : "Standalone task",
          meta: dueSoonTask.dueDate
            ? new Date(dueSoonTask.dueDate).toLocaleDateString()
            : "No date",
          classes:
            "border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-white",
        }
      : null,
    nextPlannedCall
      ? {
          id: "attention-call",
          label: "Next FollowUp",
          title: nextPlannedCall.title,
          description: nextPlannedCall.application
            ? `${nextPlannedCall.application.companyName} · ${nextPlannedCall.application.roleTitle}`
            : "General FollowUp",
          meta: nextPlannedCall.scheduledAt
            ? new Date(nextPlannedCall.scheduledAt).toLocaleDateString()
            : "No date",
          classes:
            "border-sky-200 bg-gradient-to-br from-sky-50/80 via-white to-white",
        }
      : null,
    applicationWithoutNextStep
      ? {
          id: "attention-next-step",
          label: "Missing Next Step",
          title: applicationWithoutNextStep.companyName,
          description: applicationWithoutNextStep.roleTitle,
          meta: "No next step set",
          classes:
            "border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white",
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50/50 to-sky-50/60 p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm font-medium text-slate-500">Dashboard</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
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
                {latestActivity ? (
                  <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                    Latest: {latestActivity.summaryLabel}
                  </span>
                ) : null}
              </div>

              <div className="mt-5">
                <DashboardQuickActions
                  applications={applications}
                  contacts={contacts}
                />
              </div>
            </div>

            <div className="flex justify-start lg:justify-end">
              <DashboardAiFeedbackToggle />
            </div>
          </div>
        </div>
      </section>

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
                <p className="mt-2 text-xs text-slate-500">{stat.subtitle}</p>
              </div>

              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${stat.iconClasses}`}
              >
                {stat.icon}
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
                <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">
                  {item.meta}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <RecentApplicationsSection
        applications={applications}
        showDeleteAction={false}
        showArchiveAction={false}
      />

      <section className="grid gap-6 xl:grid-cols-2">
        <RecentTasksSection tasks={recentTasks} />
        <RecentCallUpsSection callUps={recentCallUps} />
      </section>

      <DashboardActivityTimeline items={timelineItems} />
    </div>
  );
}
