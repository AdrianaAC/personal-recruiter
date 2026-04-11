import { redirect } from "next/navigation";
import { auth } from "@/auth";
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
    scheduledCalendarTasks,
    scheduledCalendarInterviews,
    scheduledCalendarFollowUps,
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
        title: true,
        description: true,
        dueDate: true,
        isSpecificDate: true,
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
        notes: true,
        scheduledAt: true,
        isSpecificDate: true,
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
        isSpecificDate: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.interview.findMany({
      where: {
        scheduledAt: {
          not: null,
        },
        outcome: {
          not: "CANCELLED",
        },
        application: {
          userId: session.user.id,
          archivedAt: null,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      select: {
        id: true,
        type: true,
        stageName: true,
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
    prisma.callUp.findMany({
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
        isSpecificDate: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
        contact: {
          select: {
            fullName: true,
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
        title: true,
        dueDate: true,
        isSpecificDate: true,
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
        isSpecificDate: true,
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
        "border-slate-300 bg-gradient-to-br from-slate-200 via-white to-white",
      iconClasses: "bg-slate-950 text-white",
      iconKey: "briefcase" as const,
    },
    {
      label: "In Process",
      value: pipelineApplicationsCount,
      subtitle: "Active applications beyond the saved stage.",
      classes:
        "border-slate-300 bg-gradient-to-br from-slate-100 via-white to-white",
      iconClasses: "bg-slate-900 text-white",
      iconKey: "spark" as const,
    },
    {
      label: "Tasks",
      value: openTasksCount,
      subtitle: "Open actions across your workflow.",
      classes:
        "border-slate-300 bg-gradient-to-br from-slate-100 via-white to-white",
      iconClasses: "bg-slate-900 text-white",
      iconKey: "send" as const,
    },
    {
      label: "FollowUps",
      value: callUpsCount,
      subtitle: "Contacts tied to active opportunities.",
      classes:
        "border-slate-300 bg-gradient-to-br from-slate-100 via-white to-white",
      iconClasses: "bg-slate-900 text-white",
      iconKey: "phone" as const,
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
  const calendarEvents = [
    ...scheduledCalendarTasks.map((task) => ({
      id: `task-${task.id}`,
      type: "task" as const,
      title: task.application
        ? `${task.title} - ${task.application.companyName}`
        : task.title,
      startsAt: task.dueDate as Date,
      isSpecificDate: task.isSpecificDate,
      href: task.application
        ? `/dashboard/applications/${task.application.id}`
        : null,
    })),
    ...scheduledCalendarInterviews.map((interview) => ({
      id: `interview-${interview.id}`,
      type: "interview" as const,
      title: interview.stageName || formatLabel(interview.type),
      startsAt: interview.scheduledAt as Date,
      href: `/dashboard/applications/${interview.application.id}`,
      meta: `${interview.application.companyName} - ${interview.application.roleTitle}`,
    })),
    ...scheduledCalendarFollowUps.map((callUp) => ({
      id: `followup-${callUp.id}`,
      type: "followup" as const,
      title: callUp.contact
        ? `${callUp.title} - ${callUp.contact.fullName}`
        : callUp.title,
      startsAt: callUp.scheduledAt as Date,
      isSpecificDate: callUp.isSpecificDate,
      href: callUp.application
        ? `/dashboard/applications/${callUp.application.id}`
        : null,
      meta: callUp.application
        ? `${callUp.application.companyName} - ${callUp.application.roleTitle}`
        : null,
    })),
  ];

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
            "border-amber-200 bg-gradient-to-br from-amber-100/80 via-white to-white",
          labelClasses: "text-amber-700",
          metaClasses: "text-amber-800/90",
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
            "border-sky-200 bg-gradient-to-br from-sky-100/80 via-white to-white",
          labelClasses: "text-sky-700",
          metaClasses: "text-sky-800/90",
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
            "border-emerald-200 bg-gradient-to-br from-emerald-100/80 via-white to-white",
          labelClasses: "text-emerald-700",
          metaClasses: "text-emerald-800/90",
        }
      : null,
  ].filter((item) => item !== null);

  return (
    <DashboardPageSections
      sessionUserName={session.user.name}
      heroHeadline={heroHeadline}
      heroDescription={heroDescription}
      applications={applications}
      quickActionApplications={applications.map((application) => ({
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
      calendarEvents={calendarEvents}
      recentTasks={recentTasks.map((task) => ({
        ...task,
        href: `/dashboard/tasks/${task.id}`,
      }))}
      recentFollowUps={recentCallUps.map((callUp) => ({
        ...callUp,
        href: `/dashboard/call-ups/${callUp.id}`,
      }))}
      recentContacts={contacts.map((contact) => ({
        ...contact,
        applicationLinksCount: contact._count.applications,
      }))}
      timelineItems={timelineItems}
    />
  );
}
