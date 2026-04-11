import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getApplicationNextStepStatus } from "@/lib/application-next-step";
import { getDashboardConflictAlerts } from "@/lib/dashboard-conflicts";
import { getApplicationStaleness } from "@/lib/application-staleness";
import { syncUserApplicationWorkflowTasks } from "@/lib/application-workflow";
import {
  getDashboardWeeklySummary,
  getEndOfWeek,
  getStartOfWeek,
} from "@/lib/dashboard-weekly-summary";
import { prisma } from "@/lib/prisma";
import { DashboardPageSections } from "@/components/dashboard/dashboard-page-sections";

const RECENT_SECTION_LIMIT = 25;

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

  await syncUserApplicationWorkflowTasks(prisma, session.user.id);
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);

  const [
    userWorkflowSettings,
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
    weeklyFollowUpTasks,
    dueSoonTask,
    nextPlannedCall,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        autoThankYouReminderEnabled: true,
      },
    }),
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
        archivedAt: true,
        createdAt: true,
        offerReceivedAt: true,
        offerExpiresAt: true,
        updatedAt: true,
        interviews: {
          select: {
            id: true,
            type: true,
            stageName: true,
            scheduledAt: true,
            outcome: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        tasks: {
          select: {
            completed: true,
            archivedAt: true,
          },
        },
        callUps: {
          select: {
            status: true,
            archivedAt: true,
          },
        },
        notes: {
          select: {
            id: true,
            title: true,
            assessmentDueDate: true,
            assessmentSubmittedAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
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
        origin: true,
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
        createdAt: true,
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
        updatedAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        companyName: true,
        jobTitle: true,
        notes: true,
        updatedAt: true,
        applications: {
          take: 1,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            application: {
              select: {
                id: true,
                companyName: true,
                roleTitle: true,
              },
            },
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
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
        origin: true,
        snoozedUntil: true,
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
        updatedAt: true,
        contact: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            jobTitle: true,
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
      take: RECENT_SECTION_LIMIT,
    }),
    prisma.task.findMany({
      where: {
        userId: session.user.id,
        origin: "auto_followup",
        completed: false,
        archivedAt: null,
        dueDate: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      select: {
        application: {
          select: {
            companyName: true,
            roleTitle: true,
          },
        },
      },
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
        origin: true,
        snoozedUntil: true,
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
  ]);

  const inProcessStatuses = [
    "SCREENING",
    "TECHNICAL_INTERVIEW",
    "TAKE_HOME",
    "FINAL_INTERVIEW",
  ];

  const applicationsWithStaleness = applications.map((application) => {
    const { interviews, notes, tasks, callUps, ...applicationSummary } = application;
    const staleness = getApplicationStaleness({
      ...applicationSummary,
      interviews,
      notes,
    });
    const nextStepStatus = getApplicationNextStepStatus({
      ...applicationSummary,
      interviews,
      tasks,
      callUps,
    });

    return {
      ...applicationSummary,
      staleLevel: staleness?.level ?? null,
      staleLabel: staleness?.label ?? null,
      staleDescription: staleness?.description ?? null,
      staleWeeks: staleness?.weeksSinceActivity ?? null,
      missingNextStepDetected: nextStepStatus.isMissingNextStep,
      missingNextStepMessage: nextStepStatus.message,
    };
  });
  const conflictAlerts = getDashboardConflictAlerts(applications);
  const weeklySummary = getDashboardWeeklySummary(
    applicationsWithStaleness,
    weeklyFollowUpTasks,
    now,
  );

  const staleApplications = applicationsWithStaleness.filter(
    (application) =>
      application.staleLevel === "stale" || application.staleLevel === "archive",
  );
  const archiveCandidateApplications = applicationsWithStaleness.filter(
    (application) => application.staleLevel === "archive",
  );
  const oldestStaleApplication = [...staleApplications].sort((a, b) => {
    const aWeeks = a.staleWeeks ?? 0;
    const bWeeks = b.staleWeeks ?? 0;
    return bWeeks - aWeeks;
  })[0] ?? null;
  const oldestArchiveCandidate = [...archiveCandidateApplications].sort((a, b) => {
    const aWeeks = a.staleWeeks ?? 0;
    const bWeeks = b.staleWeeks ?? 0;
    return bWeeks - aWeeks;
  })[0] ?? null;

  const activeApplicationsInMotionCount = applicationsWithStaleness.filter(
    (application) => inProcessStatuses.includes(application.status),
  ).length;
  const applicationWithoutNextStep =
    applicationsWithStaleness.find(
      (application) => application.missingNextStepDetected,
    ) ?? null;

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
      iconKey: "briefcase" as const,
    },
    {
      label: "In Process",
      value: pipelineApplicationsCount,
      subtitle: "Active applications beyond the saved stage.",
      classes:
        "border-emerald-200 bg-gradient-to-br from-emerald-50/60 via-white to-white",
      iconClasses: "bg-emerald-500 text-white",
      iconKey: "spark" as const,
    },
    {
      label: "Tasks",
      value: openTasksCount,
      subtitle: "Open actions across your workflow.",
      classes:
        "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white",
      iconClasses: "bg-amber-500 text-white",
      iconKey: "send" as const,
    },
    {
      label: "FollowUps",
      value: callUpsCount,
      subtitle: "Contacts tied to active opportunities.",
      classes:
        "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white",
      iconClasses: "bg-sky-600 text-white",
      iconKey: "phone" as const,
    },
    {
      label: "Stale",
      value: staleApplications.length,
      subtitle: "Applications with 6+ weeks of silence.",
      classes:
        "border-rose-200 bg-gradient-to-br from-rose-50 via-white to-white",
      iconClasses: "bg-rose-600 text-white",
      iconKey: "spark" as const,
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
          : new Date(callUp.updatedAt).getTime() >
                new Date(callUp.createdAt).getTime()
            ? callUp.application
              ? "FollowUp updated"
              : "General FollowUp updated"
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
    ...conflictAlerts,
    oldestStaleApplication
      ? {
          id: "attention-stale",
          label: oldestStaleApplication.staleLevel === "archive"
            ? "Suggest Archive"
            : "Probably Inactive",
          title: oldestStaleApplication.companyName,
          description: oldestStaleApplication.roleTitle,
          meta: oldestStaleApplication.staleDescription ?? "Needs attention",
          classes:
            oldestStaleApplication.staleLevel === "archive"
              ? "border-slate-300 bg-gradient-to-br from-slate-100/80 via-white to-white"
              : "border-rose-200 bg-gradient-to-br from-rose-50/80 via-white to-white",
        }
      : null,
    oldestArchiveCandidate
      ? {
          id: "attention-archive",
          label: "Archive Suggestion",
          title: `${archiveCandidateApplications.length} quiet application${
            archiveCandidateApplications.length === 1 ? "" : "s"
          }`,
          description: `${oldestArchiveCandidate.companyName} - ${oldestArchiveCandidate.roleTitle}`,
          meta: "8+ weeks without meaningful updates",
          classes:
            "border-slate-300 bg-gradient-to-br from-slate-100/80 via-white to-white",
        }
      : null,
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
          meta:
            applicationWithoutNextStep.missingNextStepMessage ??
            "This application has no next step defined.",
          classes:
            "border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-white",
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <DashboardPageSections
      sessionUserName={session.user.name}
      heroHeadline={heroHeadline}
      heroDescription={heroDescription}
      totalApplicationsCount={totalApplicationsCount}
      pipelineApplicationsCount={pipelineApplicationsCount}
      latestActivitySummaryLabel={latestActivity?.summaryLabel ?? null}
      applications={applicationsWithStaleness}
      quickActionApplications={applicationsWithStaleness.map((application) => ({
        id: application.id,
        companyName: application.companyName,
        roleTitle: application.roleTitle,
      }))}
      quickActionContacts={contacts.map((contact) => ({
        id: contact.id,
        fullName: contact.fullName,
        companyName: contact.companyName,
        jobTitle: contact.jobTitle,
      }))}
      dashboardStats={dashboardStats}
      attentionCards={attentionCards}
      weeklySummary={weeklySummary}
      thankYouReminderEnabled={
        userWorkflowSettings?.autoThankYouReminderEnabled ?? true
      }
      recentTasks={recentTasks}
      recentFollowUps={recentCallUps}
      recentContacts={contacts.map((contact) => ({
        ...contact,
        applicationLinksCount: contact._count.applications,
      }))}
      timelineItems={timelineItems}
    />
  );
}
