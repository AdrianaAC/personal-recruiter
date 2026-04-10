import { ApplicationStatus, Prisma } from "@prisma/client";

const AUTO_WORKFLOW_DESCRIPTION_PREFIX =
  "Automatically scheduled by workflow.";

const FOLLOW_UP_ELIGIBLE_STATUSES = new Set<ApplicationStatus>([
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "FINAL_INTERVIEW",
]);

type WorkflowEventKind = "application" | "interview" | "assessment";

type WorkflowEvent = {
  kind: WorkflowEventKind;
  eventAt: Date;
  dueDate: Date;
};

type WorkflowApplication = Prisma.JobApplicationGetPayload<{
  select: {
    id: true;
    userId: true;
    companyName: true;
    roleTitle: true;
    status: true;
    archivedAt: true;
    appliedAt: true;
    interviews: {
      select: {
        scheduledAt: true;
        createdAt: true;
      };
    };
    notes: {
      select: {
        title: true;
        content: true;
        createdAt: true;
      };
    };
  };
}>;

function addWeeks(date: Date, weeks: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + weeks * 7);
  return nextDate;
}

function isAssessmentSubmissionNote(note: {
  title: string | null;
  content: string;
}) {
  const normalizedText = `${note.title ?? ""} ${note.content}`.toLowerCase();
  const mentionsAssessment = /assessment|take[\s-]?home/.test(normalizedText);
  const mentionsSubmission =
    /submitted|submission|delivered|deliver|sent|completed|turned in|turn in/.test(
      normalizedText,
    );

  return mentionsAssessment && mentionsSubmission;
}

function compareWorkflowEvents(a: WorkflowEvent, b: WorkflowEvent) {
  const timeDiff = b.eventAt.getTime() - a.eventAt.getTime();

  if (timeDiff !== 0) {
    return timeDiff;
  }

  const priority: Record<WorkflowEventKind, number> = {
    assessment: 3,
    interview: 2,
    application: 1,
  };

  return priority[b.kind] - priority[a.kind];
}

function resolveWorkflowEvent(
  application: WorkflowApplication,
): WorkflowEvent | null {
  if (
    application.archivedAt ||
    !FOLLOW_UP_ELIGIBLE_STATUSES.has(application.status)
  ) {
    return null;
  }

  const events: WorkflowEvent[] = [];

  if (application.appliedAt) {
    events.push({
      kind: "application",
      eventAt: application.appliedAt,
      dueDate: addWeeks(application.appliedAt, 3),
    });
  }

  const latestInterview = [...application.interviews]
    .map((interview) => interview.scheduledAt ?? interview.createdAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (latestInterview) {
    events.push({
      kind: "interview",
      eventAt: latestInterview,
      dueDate: addWeeks(latestInterview, 2),
    });
  }

  const latestAssessmentSubmission = application.notes
    .filter(isAssessmentSubmissionNote)
    .map((note) => note.createdAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (latestAssessmentSubmission) {
    events.push({
      kind: "assessment",
      eventAt: latestAssessmentSubmission,
      dueDate: addWeeks(latestAssessmentSubmission, 1),
    });
  }

  return events.sort(compareWorkflowEvents)[0] ?? null;
}

function buildAutoTask(application: WorkflowApplication, event: WorkflowEvent) {
  const baseDescription = `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} · ${application.roleTitle}.`;

  switch (event.kind) {
    case "assessment":
      return {
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: assessment delivered. Due the week after the latest assessment submission.`,
        dueDate: event.dueDate,
      };
    case "interview":
      return {
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: interview completed. Due the second week after the latest interview.`,
        dueDate: event.dueDate,
      };
    case "application":
      return {
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: application submitted. Due in the third week after applying if nothing else supersedes it.`,
        dueDate: event.dueDate,
      };
  }
}

export function getAppliedAtForWorkflow(
  currentAppliedAt: Date | null,
  status: ApplicationStatus,
) {
  if (currentAppliedAt) {
    return currentAppliedAt;
  }

  if (status === "SAVED") {
    return null;
  }

  return new Date();
}

export async function syncApplicationWorkflowTask(
  tx: Prisma.TransactionClient,
  applicationId: string,
) {
  const application = await tx.jobApplication.findUnique({
    where: {
      id: applicationId,
    },
    select: {
      id: true,
      userId: true,
      companyName: true,
      roleTitle: true,
      status: true,
      archivedAt: true,
      appliedAt: true,
      interviews: {
        select: {
          scheduledAt: true,
          createdAt: true,
        },
      },
      notes: {
        select: {
          title: true,
          content: true,
          createdAt: true,
        },
      },
    },
  });

  if (!application) {
    return;
  }

  const openAutoTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId,
      archivedAt: null,
      completed: false,
      description: {
        startsWith: AUTO_WORKFLOW_DESCRIPTION_PREFIX,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
    },
  });

  const event = resolveWorkflowEvent(application);

  if (!event) {
    if (openAutoTasks.length > 0) {
      await tx.task.deleteMany({
        where: {
          id: {
            in: openAutoTasks.map((task) => task.id),
          },
        },
      });
    }

    return;
  }

  const autoTask = buildAutoTask(application, event);
  const [primaryTask, ...duplicateTasks] = openAutoTasks;

  if (primaryTask) {
    await tx.task.update({
      where: {
        id: primaryTask.id,
      },
      data: autoTask,
    });
  } else {
    await tx.task.create({
      data: {
        userId: application.userId,
        applicationId,
        ...autoTask,
      },
    });
  }

  if (duplicateTasks.length > 0) {
    await tx.task.deleteMany({
      where: {
        id: {
          in: duplicateTasks.map((task) => task.id),
        },
      },
    });
  }
}
