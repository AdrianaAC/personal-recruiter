const ACTIVE_APPLICATION_STATUSES = new Set([
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "FINAL_INTERVIEW",
  "OFFER",
]);

type NextStepInterview = {
  scheduledAt?: string | Date | null;
  outcome?: string | null;
};

type NextStepTask = {
  completed?: boolean;
  archivedAt?: string | Date | null;
};

type NextStepCallUp = {
  status?: string | null;
  archivedAt?: string | Date | null;
};

type NextStepApplicationInput = {
  status: string;
  nextStep?: string | null;
  interviews?: NextStepInterview[];
  tasks?: NextStepTask[];
  callUps?: NextStepCallUp[];
};

export type ApplicationNextStepStatus = {
  isMissingNextStep: boolean;
  message: string | null;
};

function toDate(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function hasUpcomingInterview(
  interviews: NextStepInterview[] | undefined,
  now: Date,
) {
  return (interviews ?? []).some((interview) => {
    const scheduledAt = toDate(interview.scheduledAt);

    return (
      scheduledAt !== null &&
      scheduledAt.getTime() >= now.getTime() &&
      interview.outcome !== "CANCELLED"
    );
  });
}

function hasOpenTask(tasks: NextStepTask[] | undefined) {
  return (tasks ?? []).some(
    (task) => task.completed !== true && toDate(task.archivedAt) === null,
  );
}

function hasPendingFollowUp(callUps: NextStepCallUp[] | undefined) {
  return (callUps ?? []).some(
    (callUp) =>
      callUp.status === "PLANNED" && toDate(callUp.archivedAt) === null,
  );
}

export function getApplicationNextStepStatus(
  application: NextStepApplicationInput,
  now = new Date(),
): ApplicationNextStepStatus {
  if (!ACTIVE_APPLICATION_STATUSES.has(application.status)) {
    return {
      isMissingNextStep: false,
      message: null,
    };
  }

  if (application.nextStep?.trim()) {
    return {
      isMissingNextStep: false,
      message: null,
    };
  }

  if (hasUpcomingInterview(application.interviews, now)) {
    return {
      isMissingNextStep: false,
      message: null,
    };
  }

  if (hasOpenTask(application.tasks)) {
    return {
      isMissingNextStep: false,
      message: null,
    };
  }

  if (hasPendingFollowUp(application.callUps)) {
    return {
      isMissingNextStep: false,
      message: null,
    };
  }

  return {
    isMissingNextStep: true,
    message: "This application has no next step defined.",
  };
}
