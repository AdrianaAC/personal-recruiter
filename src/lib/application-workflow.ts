import {
  ApplicationStatus,
  Prisma,
  PrismaClient,
  TaskWorkflowEventKind,
  TaskWorkflowStage,
} from "@prisma/client";

const AUTO_WORKFLOW_DESCRIPTION_PREFIX =
  "Automatically scheduled by workflow.";

const FOLLOW_UP_ELIGIBLE_STATUSES = new Set<ApplicationStatus>([
  "APPLIED",
  "SCREENING",
  "TECHNICAL_INTERVIEW",
  "TAKE_HOME",
  "FINAL_INTERVIEW",
]);

const CLOSED_APPLICATION_STATUSES = new Set<string>([
  "REJECTED",
  "WITHDRAWN",
  "HIRED",
  "OFFER_ACCEPTED_ELSEWHERE",
]);

const RECENT_ACTIVITY_COOLDOWN_WEEKS = 1;
const FOLLOW_UP_ESCALATION_WEEKS = 2;
const RECENT_ACTIVITY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const INTERVIEW_PREP_FAR_AWAY_DAYS = 7;
const INTERVIEW_PREP_CLOSE_DAYS = 2;
const ASSESSMENT_REMINDER_DAYS = {
  dueSoon: 3,
  dueTomorrow: 1,
} as const;
const OFFER_EXPIRATION_REMINDER_DAYS = {
  dueSoon: 3,
  dueTomorrow: 1,
} as const;

type WorkflowEventKind = "application" | "interview" | "assessment" | "offer";
type WorkflowTaskOrigin =
  | "auto_followup"
  | "auto_deadline"
  | "auto_prep"
  | "auto_review";
type WorkflowStage =
  | "initial"
  | "final"
  | "assessment_due_3d"
  | "assessment_due_1d"
  | "assessment_overdue"
  | "interview_prep_lead"
  | "interview_prep_day_of"
  | "interview_reflection"
  | "interview_thank_you"
  | "offer_review"
  | "offer_expiration_3d"
  | "offer_expiration_1d"
  | "offer_expired";

type WorkflowEvent = {
  kind: WorkflowEventKind;
  eventAt: Date;
  dueDate: Date;
};

type WorkflowTaskDefinition = {
  origin: WorkflowTaskOrigin;
  stage: WorkflowStage;
  kind: WorkflowEventKind;
  sourceId: string | null;
  eventAt: Date;
  dueDate: Date;
  title: string;
  description: string;
};

type WorkflowTrackedTask = {
  workflowSourceId: string | null;
  workflowStage: TaskWorkflowStage | null;
  workflowEventKind: TaskWorkflowEventKind | null;
  workflowEventAt: Date | null;
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
    offerReceivedAt: true;
    offerExpiresAt: true;
    updatedAt: true;
    user: {
      select: {
        autoThankYouReminderEnabled: true;
      };
    };
    interviews: {
      select: {
        id: true;
        type: true;
        stageName: true;
        scheduledAt: true;
        interviewerName: true;
        locationOrLink: true;
        outcome: true;
        createdAt: true;
        updatedAt: true;
      };
    };
    notes: {
      select: {
        id: true;
        title: true;
        content: true;
        assessmentDueDate: true;
        assessmentSubmittedAt: true;
        createdAt: true;
        updatedAt: true;
      };
    };
  };
}>;

type WorkflowAssessmentNote = WorkflowApplication["notes"][number];
type WorkflowInterview = WorkflowApplication["interviews"][number];

function addWeeks(date: Date, weeks: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + weeks * 7);
  return nextDate;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfDay(date: Date) {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
}

function getWorkflowSourceKey(sourceId: string | null, stage: WorkflowStage | TaskWorkflowStage) {
  return `${sourceId ?? "application"}:${stage}`;
}

function isAssessmentSubmissionNote(note: {
  title: string | null;
  content: string;
  assessmentSubmittedAt?: Date | null;
}) {
  if (note.assessmentSubmittedAt) {
    return true;
  }

  const normalizedText = `${note.title ?? ""} ${note.content}`.toLowerCase();
  const mentionsAssessment = /assessment|take[\s-]?home/.test(normalizedText);
  const mentionsSubmission =
    /submitted|submission|delivered|deliver|sent|completed|turned in|turn in/.test(
      normalizedText,
    );

  return mentionsAssessment && mentionsSubmission;
}

function getAssessmentSubmissionAt(note: WorkflowAssessmentNote) {
  if (note.assessmentSubmittedAt) {
    return note.assessmentSubmittedAt;
  }

  return isAssessmentSubmissionNote(note) ? note.createdAt : null;
}

function compareWorkflowEvents(a: WorkflowEvent, b: WorkflowEvent) {
  const timeDiff = b.eventAt.getTime() - a.eventAt.getTime();

  if (timeDiff !== 0) {
    return timeDiff;
  }

  const dueDateDiff = a.dueDate.getTime() - b.dueDate.getTime();

  if (dueDateDiff !== 0) {
    return dueDateDiff;
  }

  return a.kind.localeCompare(b.kind);
}

function isApplicationClosedForAutomation(application: {
  status: ApplicationStatus;
  archivedAt: Date | null;
}) {
  if (application.archivedAt) {
    return true;
  }

  return CLOSED_APPLICATION_STATUSES.has(application.status);
}

function resolveLatestActivityAt(application: WorkflowApplication) {
  const activityDates = [
    application.updatedAt,
    application.offerReceivedAt,
    application.offerExpiresAt,
    ...application.interviews.flatMap((interview) => [
      interview.createdAt,
      interview.updatedAt,
      interview.scheduledAt,
    ]),
    ...application.notes.flatMap((note) => [
      note.createdAt,
      note.updatedAt,
      note.assessmentDueDate,
      note.assessmentSubmittedAt,
    ]),
  ].filter((value): value is Date => value !== null);

  return activityDates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}

function hasApplicationActivitySince(
  application: WorkflowApplication,
  timestamp: Date,
) {
  const latestActivityAt = resolveLatestActivityAt(application);

  if (!latestActivityAt) {
    return false;
  }

  return latestActivityAt.getTime() > timestamp.getTime();
}

function applyRecentActivityCooldown(
  application: WorkflowApplication,
  event: WorkflowEvent,
) {
  const latestActivityAt = resolveLatestActivityAt(application);

  if (!latestActivityAt) {
    return event;
  }

  const activityAgeMs = Date.now() - latestActivityAt.getTime();

  if (activityAgeMs > RECENT_ACTIVITY_WINDOW_MS) {
    return event;
  }

  const postponedDueDate = addWeeks(
    latestActivityAt,
    RECENT_ACTIVITY_COOLDOWN_WEEKS,
  );

  return {
    ...event,
    dueDate:
      event.dueDate.getTime() > postponedDueDate.getTime()
        ? event.dueDate
        : postponedDueDate,
  };
}

function resolveFollowUpWorkflowEvent(
  application: WorkflowApplication,
): WorkflowEvent | null {
  if (isApplicationClosedForAutomation(application)) {
    return null;
  }

  if (!FOLLOW_UP_ELIGIBLE_STATUSES.has(application.status)) {
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
    .map(getAssessmentSubmissionAt)
    .filter((value): value is Date => value !== null)
    .sort((a, b) => b.getTime() - a.getTime())[0];

  if (latestAssessmentSubmission) {
    events.push({
      kind: "assessment",
      eventAt: latestAssessmentSubmission,
      dueDate: addWeeks(latestAssessmentSubmission, 1),
    });
  }

  const latestMeaningfulEvent = events.sort(compareWorkflowEvents)[0] ?? null;

  if (!latestMeaningfulEvent) {
    return null;
  }

  return applyRecentActivityCooldown(application, latestMeaningfulEvent);
}

function describeWorkflowTrigger(kind: WorkflowEventKind) {
  switch (kind) {
    case "assessment":
      return "the latest assessment submission";
    case "interview":
      return "the latest interview";
    case "application":
      return "the application submission";
    case "offer":
      return "the offer";
  }
}

function buildInitialAutoFollowUpTask(
  application: WorkflowApplication,
  event: WorkflowEvent,
): WorkflowTaskDefinition {
  const baseDescription = `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}.`;

  switch (event.kind) {
    case "assessment":
      return {
        origin: "auto_followup",
        stage: "initial",
        kind: event.kind,
        sourceId: null,
        eventAt: event.eventAt,
        dueDate: event.dueDate,
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: assessment delivered. Due the week after the latest assessment submission.`,
      };
    case "interview":
      return {
        origin: "auto_followup",
        stage: "initial",
        kind: event.kind,
        sourceId: null,
        eventAt: event.eventAt,
        dueDate: event.dueDate,
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: interview completed. Due the second week after the latest interview.`,
      };
    case "application":
      return {
        origin: "auto_followup",
        stage: "initial",
        kind: event.kind,
        sourceId: null,
        eventAt: event.eventAt,
        dueDate: event.dueDate,
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: application submitted. Due in the third week after applying if nothing else supersedes it.`,
      };
    case "offer":
      return {
        origin: "auto_followup",
        stage: "initial",
        kind: event.kind,
        sourceId: null,
        eventAt: event.eventAt,
        dueDate: event.dueDate,
        title: `Follow up with ${application.companyName}`,
        description: `${baseDescription} Trigger: offer activity.`,
      };
  }
}

function buildEscalationAutoFollowUpTask(
  application: WorkflowApplication,
  event: WorkflowEvent,
  previousFollowUpAt: Date,
): WorkflowTaskDefinition {
  const baseDescription = `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}.`;
  const escalatedEvent = applyRecentActivityCooldown(application, {
    ...event,
    dueDate: addWeeks(previousFollowUpAt, FOLLOW_UP_ESCALATION_WEEKS),
  });

  return {
    origin: "auto_followup",
    stage: "final",
    kind: escalatedEvent.kind,
    sourceId: null,
    eventAt: escalatedEvent.eventAt,
    dueDate: escalatedEvent.dueDate,
    title: `Final follow-up with ${application.companyName}`,
    description: `${baseDescription} Trigger: no reply after your previous follow-up about ${describeWorkflowTrigger(event.kind)}. Due two weeks after the previous follow-up. If this also goes unanswered, consider marking the application inactive.`,
  };
}

function getInterviewLabel(interview: WorkflowInterview) {
  if (interview.stageName?.trim()) {
    return interview.stageName.trim();
  }

  return interview.type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildInterviewPrepDescription(
  application: WorkflowApplication,
  interview: WorkflowInterview,
  summary: string,
) {
  const locationLine = interview.locationOrLink
    ? `Location / link: ${interview.locationOrLink}.`
    : "Confirm the location or meeting link.";
  const interviewerLine = interview.interviewerName
    ? `Interviewer: ${interview.interviewerName}.`
    : "Review who you are speaking with.";

  return [
    `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}.`,
    summary,
    interviewerLine,
    locationLine,
    "Checklist:",
    "- Review the company, role, and team context.",
    "- Prepare STAR examples that match the interview stage.",
    "- Test your microphone, camera, and interview setup.",
    "- Prepare thoughtful questions for the interviewer.",
  ].join("\n");
}

function buildInterviewPrepTasks(
  application: WorkflowApplication,
  interview: WorkflowInterview,
  now = new Date(),
) {
  if (
    isApplicationClosedForAutomation(application) ||
    !interview.scheduledAt ||
    interview.outcome === "CANCELLED" ||
    interview.scheduledAt.getTime() <= now.getTime()
  ) {
    return [] as WorkflowTaskDefinition[];
  }

  const scheduledAt = interview.scheduledAt;
  const timeUntilInterviewMs = scheduledAt.getTime() - now.getTime();
  const farAwayThresholdMs = INTERVIEW_PREP_FAR_AWAY_DAYS * 24 * 60 * 60 * 1000;
  const leadOffsetDays =
    timeUntilInterviewMs >= farAwayThresholdMs
      ? INTERVIEW_PREP_FAR_AWAY_DAYS
      : INTERVIEW_PREP_CLOSE_DAYS;
  const leadDueDate = addDays(scheduledAt, -leadOffsetDays);
  const leadTasks: WorkflowTaskDefinition[] = [];
  const interviewLabel = getInterviewLabel(interview);

  if (now.getTime() >= leadDueDate.getTime()) {
    leadTasks.push({
      origin: "auto_prep",
      stage: "interview_prep_lead",
      kind: "interview",
      sourceId: interview.id,
      eventAt: scheduledAt,
      dueDate: leadDueDate,
      title: `Prepare for ${interviewLabel} at ${application.companyName}`,
      description: buildInterviewPrepDescription(
        application,
        interview,
        leadOffsetDays === INTERVIEW_PREP_FAR_AWAY_DAYS
          ? "Prep reminder: the interview is one week away."
          : "Prep reminder: the interview is coming up soon.",
      ),
    });
  }

  if (
    now.getTime() >= startOfDay(scheduledAt).getTime() &&
    now.getTime() < scheduledAt.getTime()
  ) {
    leadTasks.push({
      origin: "auto_prep",
      stage: "interview_prep_day_of",
      kind: "interview",
      sourceId: interview.id,
      eventAt: scheduledAt,
      dueDate: scheduledAt,
      title: `Review notes before ${application.companyName} interview`,
      description: buildInterviewPrepDescription(
        application,
        interview,
        "Same-day review: run through your notes, company context, and questions before the interview starts.",
      ),
    });
  }

  return leadTasks;
}

function buildInterviewReflectionDescription(
  application: WorkflowApplication,
  interview: WorkflowInterview,
) {
  const interviewLabel = getInterviewLabel(interview);
  const interviewerLine = interview.interviewerName
    ? `Interviewer: ${interview.interviewerName}.`
    : "Capture who you spoke with while it is still fresh.";

  return [
    `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}.`,
    `Reflection reminder after the ${interviewLabel}.`,
    interviewerLine,
    "Checklist:",
    "- Write down what was asked.",
    "- Note interviewer names and roles.",
    "- Capture the technical topics or prompts that came up.",
    "- Record doubts, signals, and the next expected step.",
  ].join("\n");
}

function buildInterviewReflectionTask(
  application: WorkflowApplication,
  interview: WorkflowInterview,
  now = new Date(),
) {
  if (
    isApplicationClosedForAutomation(application) ||
    !interview.scheduledAt ||
    interview.outcome === "CANCELLED" ||
    interview.scheduledAt.getTime() > now.getTime()
  ) {
    return null;
  }

  const scheduledAt = interview.scheduledAt;
  const nextDayAt = addDays(scheduledAt, 1);
  const dueDate =
    now.getTime() < addDays(startOfDay(scheduledAt), 1).getTime()
      ? scheduledAt
      : nextDayAt;

  return {
    origin: "auto_review" as const,
    stage: "interview_reflection" as const,
    kind: "interview" as const,
    sourceId: interview.id,
    eventAt: scheduledAt,
    dueDate,
    title: `Reflect on ${getInterviewLabel(interview)} at ${application.companyName}`,
    description: buildInterviewReflectionDescription(application, interview),
  };
}

function buildInterviewThankYouDescription(
  application: WorkflowApplication,
  interview: WorkflowInterview,
) {
  const interviewLabel = getInterviewLabel(interview);
  const interviewerLine = interview.interviewerName
    ? `Send it to ${interview.interviewerName} or the recruiter coordinating the process.`
    : "Send it to the interviewer or recruiter coordinating the process.";

  return [
    `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}.`,
    `Thank-you reminder after the ${interviewLabel}.`,
    interviewerLine,
    "Checklist:",
    "- Send a thank-you email or LinkedIn message within 24 hours.",
    "- Mention one or two specifics from the conversation.",
    "- Reconfirm your interest in the role and next step.",
  ].join("\n");
}

function buildInterviewThankYouTask(
  application: WorkflowApplication,
  interview: WorkflowInterview,
  now = new Date(),
) {
  if (
    isApplicationClosedForAutomation(application) ||
    !application.user.autoThankYouReminderEnabled ||
    !interview.scheduledAt ||
    interview.outcome === "CANCELLED" ||
    interview.scheduledAt.getTime() > now.getTime()
  ) {
    return null;
  }

  const scheduledAt = interview.scheduledAt;

  return {
    origin: "auto_review" as const,
    stage: "interview_thank_you" as const,
    kind: "interview" as const,
    sourceId: interview.id,
    eventAt: scheduledAt,
    dueDate: addDays(scheduledAt, 1),
    title: `Send thank-you after ${getInterviewLabel(interview)} at ${application.companyName}`,
    description: buildInterviewThankYouDescription(application, interview),
  };
}

function buildInterviewReviewTasks(
  application: WorkflowApplication,
  interview: WorkflowInterview,
  now = new Date(),
) {
  const tasks: WorkflowTaskDefinition[] = [];
  const reflectionTask = buildInterviewReflectionTask(application, interview, now);

  if (reflectionTask) {
    tasks.push(reflectionTask);
  }

  const thankYouTask = buildInterviewThankYouTask(application, interview, now);

  if (thankYouTask) {
    tasks.push(thankYouTask);
  }

  return tasks;
}

function buildOfferReviewDescription(application: WorkflowApplication) {
  return [
    `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}.`,
    "Offer review reminder.",
    "Checklist:",
    "- Review salary, bonus, equity, and total compensation.",
    "- Check benefits, contract type, equipment, and support.",
    "- Confirm start date, location expectations, and onboarding details.",
    "- Capture questions, tradeoffs, and your decision notes.",
  ].join("\n");
}

function buildOfferReviewTask(application: WorkflowApplication) {
  if (
    isApplicationClosedForAutomation(application) ||
    application.status !== "OFFER" ||
    !application.offerReceivedAt
  ) {
    return null;
  }

  return {
    origin: "auto_review" as const,
    stage: "offer_review" as const,
    kind: "offer" as const,
    sourceId: "offer",
    eventAt: application.offerReceivedAt,
    dueDate: application.offerReceivedAt,
    title: `Review offer from ${application.companyName}`,
    description: buildOfferReviewDescription(application),
  };
}

function resolveOfferExpirationStage(dueDate: Date, now = new Date()) {
  if (now.getTime() > dueDate.getTime()) {
    return "offer_expired" as const;
  }

  if (
    now.getTime() >=
    addDays(dueDate, -OFFER_EXPIRATION_REMINDER_DAYS.dueTomorrow).getTime()
  ) {
    return "offer_expiration_1d" as const;
  }

  if (
    now.getTime() >=
    addDays(dueDate, -OFFER_EXPIRATION_REMINDER_DAYS.dueSoon).getTime()
  ) {
    return "offer_expiration_3d" as const;
  }

  return null;
}

function buildOfferExpirationTask(
  application: WorkflowApplication,
): WorkflowTaskDefinition | null {
  if (
    isApplicationClosedForAutomation(application) ||
    application.status !== "OFFER" ||
    !application.offerExpiresAt
  ) {
    return null;
  }

  const stage = resolveOfferExpirationStage(application.offerExpiresAt);

  if (!stage) {
    return null;
  }

  const baseDescription = `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}. Offer expires on ${application.offerExpiresAt.toLocaleDateString()}.`;

  switch (stage) {
    case "offer_expiration_3d":
      return {
        origin: "auto_deadline",
        stage,
        kind: "offer",
        sourceId: "offer",
        eventAt: application.offerExpiresAt,
        dueDate: application.offerExpiresAt,
        title: `Offer decision due soon for ${application.companyName}`,
        description: `${baseDescription} Reminder: 3 days left to review the offer and respond.`,
      };
    case "offer_expiration_1d":
      return {
        origin: "auto_deadline",
        stage,
        kind: "offer",
        sourceId: "offer",
        eventAt: application.offerExpiresAt,
        dueDate: application.offerExpiresAt,
        title: `Offer decision due tomorrow for ${application.companyName}`,
        description: `${baseDescription} Reminder: 1 day left to confirm or negotiate.`,
      };
    case "offer_expired":
      return {
        origin: "auto_deadline",
        stage,
        kind: "offer",
        sourceId: "offer",
        eventAt: application.offerExpiresAt,
        dueDate: application.offerExpiresAt,
        title: `Offer deadline passed for ${application.companyName}`,
        description: `${baseDescription} The offer deadline has passed. Confirm the current status before this slips.`,
      };
  }
}

function resolveAssessmentDeadlineStage(dueDate: Date, now = new Date()) {
  if (now.getTime() > dueDate.getTime()) {
    return "assessment_overdue" as const;
  }

  if (now.getTime() >= addDays(dueDate, -ASSESSMENT_REMINDER_DAYS.dueTomorrow).getTime()) {
    return "assessment_due_1d" as const;
  }

  if (now.getTime() >= addDays(dueDate, -ASSESSMENT_REMINDER_DAYS.dueSoon).getTime()) {
    return "assessment_due_3d" as const;
  }

  return null;
}

function buildAssessmentDeadlineTask(
  application: WorkflowApplication,
  assessment: WorkflowAssessmentNote,
): WorkflowTaskDefinition | null {
  if (!assessment.assessmentDueDate || assessment.assessmentSubmittedAt) {
    return null;
  }

  const stage = resolveAssessmentDeadlineStage(assessment.assessmentDueDate);

  if (!stage) {
    return null;
  }

  const baseDescription = `${AUTO_WORKFLOW_DESCRIPTION_PREFIX} ${application.companyName} - ${application.roleTitle}. Assessment deadline: ${assessment.assessmentDueDate.toLocaleDateString()}.`;

  switch (stage) {
    case "assessment_due_3d":
      return {
        origin: "auto_deadline",
        stage,
        kind: "assessment",
        sourceId: assessment.id,
        eventAt: assessment.assessmentDueDate,
        dueDate: assessment.assessmentDueDate,
        title: `Assessment due soon for ${application.companyName}`,
        description: `${baseDescription} Reminder: 3 days left to submit the assessment.`,
      };
    case "assessment_due_1d":
      return {
        origin: "auto_deadline",
        stage,
        kind: "assessment",
        sourceId: assessment.id,
        eventAt: assessment.assessmentDueDate,
        dueDate: assessment.assessmentDueDate,
        title: `Assessment due tomorrow for ${application.companyName}`,
        description: `${baseDescription} Reminder: 1 day left to submit the assessment.`,
      };
    case "assessment_overdue":
      return {
        origin: "auto_deadline",
        stage,
        kind: "assessment",
        sourceId: assessment.id,
        eventAt: assessment.assessmentDueDate,
        dueDate: assessment.assessmentDueDate,
        title: `Assessment overdue for ${application.companyName}`,
        description: `${baseDescription} The assessment deadline has passed and no submission is marked yet.`,
      };
  }
}

function isSameWorkflowEvent(
  previousEvent: {
    workflowEventKind: TaskWorkflowEventKind | null;
    workflowEventAt: Date | null;
  },
  nextEvent: WorkflowEvent,
) {
  return (
    previousEvent.workflowEventKind === nextEvent.kind &&
    previousEvent.workflowEventAt?.getTime() === nextEvent.eventAt.getTime()
  );
}

function isSameWorkflowTask(
  previousTask: WorkflowTrackedTask,
  nextTask: WorkflowTaskDefinition,
) {
  return (
    previousTask.workflowSourceId === nextTask.sourceId &&
    previousTask.workflowStage === nextTask.stage &&
    previousTask.workflowEventKind === nextTask.kind &&
    previousTask.workflowEventAt?.getTime() === nextTask.eventAt.getTime()
  );
}

function shouldRespectSnoozeUntil(
  task: WorkflowTrackedTask & {
    snoozedUntil: Date | null;
  },
  nextTask: WorkflowTaskDefinition,
) {
  if (!task.snoozedUntil) {
    return false;
  }

  return isSameWorkflowTask(task, nextTask);
}

function isNewerWorkflowEvent(
  previousEvent: {
    workflowEventKind: TaskWorkflowEventKind | null;
    workflowEventAt: Date | null;
  },
  nextEvent: WorkflowEvent,
) {
  if (!previousEvent.workflowEventAt || !previousEvent.workflowEventKind) {
    return true;
  }

  if (nextEvent.eventAt.getTime() !== previousEvent.workflowEventAt.getTime()) {
    return nextEvent.eventAt.getTime() > previousEvent.workflowEventAt.getTime();
  }

  return previousEvent.workflowEventKind !== nextEvent.kind;
}

function getAssessmentDeadlineStageRank(
  stage: TaskWorkflowStage | WorkflowStage | null,
) {
  switch (stage) {
    case "assessment_due_3d":
    case "offer_expiration_3d":
      return 1;
    case "assessment_due_1d":
    case "offer_expiration_1d":
      return 2;
    case "assessment_overdue":
    case "offer_expired":
      return 3;
    default:
      return null;
  }
}

function canCreateAssessmentDeadlineTask(
  previousTask:
    | {
        workflowSourceId: string | null;
        workflowStage: TaskWorkflowStage | null;
        workflowEventAt: Date | null;
      }
    | null
    | undefined,
  nextTask: WorkflowTaskDefinition,
) {
  if (!previousTask) {
    return true;
  }

  if (previousTask.workflowSourceId !== nextTask.sourceId) {
    return true;
  }

  if (previousTask.workflowEventAt?.getTime() !== nextTask.eventAt.getTime()) {
    return true;
  }

  const previousRank = getAssessmentDeadlineStageRank(previousTask.workflowStage);
  const nextRank = getAssessmentDeadlineStageRank(nextTask.stage);

  if (previousRank === null || nextRank === null) {
    return true;
  }

  return nextRank > previousRank;
}

function canCreateScheduledPrepTask(
  previousTask:
    | {
        workflowSourceId: string | null;
        workflowStage: TaskWorkflowStage | null;
        workflowEventAt: Date | null;
      }
    | null
    | undefined,
  nextTask: WorkflowTaskDefinition,
) {
  if (!previousTask) {
    return true;
  }

  if (previousTask.workflowSourceId !== nextTask.sourceId) {
    return true;
  }

  if (previousTask.workflowStage !== nextTask.stage) {
    return true;
  }

  return previousTask.workflowEventAt?.getTime() !== nextTask.eventAt.getTime();
}

function resolveEscalationAutoFollowUpTask(
  application: WorkflowApplication,
  event: WorkflowEvent,
  latestResolvedAutoTask: {
    workflowStage: TaskWorkflowStage | null;
    workflowEventKind: TaskWorkflowEventKind | null;
    workflowEventAt: Date | null;
    archivedAt: Date | null;
  } | null,
) {
  if (!latestResolvedAutoTask) {
    return null;
  }

  if (latestResolvedAutoTask.workflowStage !== "initial") {
    return null;
  }

  if (!latestResolvedAutoTask.archivedAt) {
    return null;
  }

  if (!isSameWorkflowEvent(latestResolvedAutoTask, event)) {
    return null;
  }

  if (hasApplicationActivitySince(application, latestResolvedAutoTask.archivedAt)) {
    return null;
  }

  const escalationDueDate = addWeeks(
    latestResolvedAutoTask.archivedAt,
    FOLLOW_UP_ESCALATION_WEEKS,
  );

  if (Date.now() < escalationDueDate.getTime()) {
    return null;
  }

  return buildEscalationAutoFollowUpTask(
    application,
    event,
    latestResolvedAutoTask.archivedAt,
  );
}

function resolveAutoFollowUpTaskDefinition(
  application: WorkflowApplication,
  event: WorkflowEvent,
  latestResolvedAutoTask: {
    workflowStage: TaskWorkflowStage | null;
    workflowEventKind: TaskWorkflowEventKind | null;
    workflowEventAt: Date | null;
    archivedAt: Date | null;
  } | null,
) {
  const initialTask = buildInitialAutoFollowUpTask(application, event);

  if (!latestResolvedAutoTask) {
    return initialTask;
  }

  if (isNewerWorkflowEvent(latestResolvedAutoTask, event)) {
    return initialTask;
  }

  return resolveEscalationAutoFollowUpTask(
    application,
    event,
    latestResolvedAutoTask,
  );
}

async function syncAutoFollowUpTasks(
  tx: Prisma.TransactionClient,
  application: WorkflowApplication,
) {
  const openAutoTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      archivedAt: null,
      completed: false,
      origin: "auto_followup",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      snoozedUntil: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventKind: true,
      workflowEventAt: true,
    },
  });

  const latestResolvedAutoTask = await tx.task.findFirst({
    where: {
      userId: application.userId,
      applicationId: application.id,
      origin: "auto_followup",
      OR: [
        {
          completed: true,
        },
        {
          archivedAt: {
            not: null,
          },
        },
      ],
    },
    orderBy: [
      {
        workflowEventAt: "desc",
      },
      {
        archivedAt: "desc",
      },
      {
        updatedAt: "desc",
      },
    ],
    select: {
      id: true,
      workflowStage: true,
      workflowEventKind: true,
      workflowEventAt: true,
      archivedAt: true,
    },
  });

  const event = resolveFollowUpWorkflowEvent(application);

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

  let targetTask = resolveAutoFollowUpTaskDefinition(
    application,
    event,
    latestResolvedAutoTask,
  );
  const [primaryTask, ...duplicateTasks] = openAutoTasks;

  if (
    !targetTask &&
    primaryTask &&
    primaryTask.workflowStage === "initial" &&
    isSameWorkflowEvent(primaryTask, event)
  ) {
    targetTask = buildInitialAutoFollowUpTask(application, event);
  }

  if (!targetTask) {
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

  if (primaryTask) {
    if (shouldRespectSnoozeUntil(primaryTask, targetTask)) {
      const snoozedUntil = primaryTask.snoozedUntil;

      if (!snoozedUntil) {
        return;
      }

      await tx.task.update({
        where: {
          id: primaryTask.id,
        },
        data: {
          dueDate:
            snoozedUntil.getTime() > targetTask.dueDate.getTime()
              ? snoozedUntil
              : targetTask.dueDate,
        },
      });
    } else if (!isSameWorkflowTask(primaryTask, targetTask)) {
      await tx.task.update({
        where: {
          id: primaryTask.id,
        },
        data: {
          title: targetTask.title,
          description: targetTask.description,
          dueDate: targetTask.dueDate,
          snoozedUntil: null,
          workflowSourceId: targetTask.sourceId,
          workflowStage: targetTask.stage,
          workflowEventKind: targetTask.kind,
          workflowEventAt: targetTask.eventAt,
        },
      });
    } else {
      await tx.task.update({
        where: {
          id: primaryTask.id,
        },
        data: {
          title: targetTask.title,
          description: targetTask.description,
          dueDate: targetTask.dueDate,
        },
      });
    }
  } else {
    await tx.task.create({
      data: {
        userId: application.userId,
        applicationId: application.id,
        origin: targetTask.origin,
        workflowSourceId: targetTask.sourceId,
        workflowStage: targetTask.stage,
        workflowEventKind: targetTask.kind,
        workflowEventAt: targetTask.eventAt,
        title: targetTask.title,
        description: targetTask.description,
        dueDate: targetTask.dueDate,
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

async function syncAssessmentDeadlineTasks(
  tx: Prisma.TransactionClient,
  application: WorkflowApplication,
) {
  const openAutoDeadlineTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      archivedAt: null,
      completed: false,
      origin: "auto_deadline",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventKind: true,
      workflowEventAt: true,
      createdAt: true,
    },
  });

  const resolvedAutoDeadlineTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      origin: "auto_deadline",
      OR: [
        {
          completed: true,
        },
        {
          archivedAt: {
            not: null,
          },
        },
      ],
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        archivedAt: "desc",
      },
    ],
    select: {
      id: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventAt: true,
      archivedAt: true,
      updatedAt: true,
    },
  });

  const openTasksBySourceId = new Map<
    string,
    typeof openAutoDeadlineTasks
  >();

  for (const task of openAutoDeadlineTasks) {
    if (!task.workflowSourceId) {
      continue;
    }

    const existingTasks = openTasksBySourceId.get(task.workflowSourceId) ?? [];
    existingTasks.push(task);
    openTasksBySourceId.set(task.workflowSourceId, existingTasks);
  }

  const latestResolvedBySourceId = new Map<
    string,
    (typeof resolvedAutoDeadlineTasks)[number]
  >();

  for (const task of resolvedAutoDeadlineTasks) {
    if (!task.workflowSourceId || latestResolvedBySourceId.has(task.workflowSourceId)) {
      continue;
    }

    latestResolvedBySourceId.set(task.workflowSourceId, task);
  }

  const activeSourceIds = new Set<string>();

  if (!isApplicationClosedForAutomation(application)) {
    for (const assessment of application.notes) {
      const targetTask = buildAssessmentDeadlineTask(application, assessment);
      const sourceId = assessment.id;
      const sourceTasks = openTasksBySourceId.get(sourceId) ?? [];
      const [primaryTask, ...duplicateTasks] = sourceTasks;

      if (!targetTask) {
        if (sourceTasks.length > 0) {
          await tx.task.deleteMany({
            where: {
              id: {
                in: sourceTasks.map((task) => task.id),
              },
            },
          });
        }

        continue;
      }

      activeSourceIds.add(sourceId);

      if (primaryTask) {
        if (!isSameWorkflowTask(primaryTask, targetTask)) {
          await tx.task.update({
            where: {
              id: primaryTask.id,
            },
            data: {
              title: targetTask.title,
              description: targetTask.description,
              dueDate: targetTask.dueDate,
              workflowSourceId: targetTask.sourceId,
              workflowStage: targetTask.stage,
              workflowEventKind: targetTask.kind,
              workflowEventAt: targetTask.eventAt,
            },
          });
        } else {
          await tx.task.update({
            where: {
              id: primaryTask.id,
            },
            data: {
              title: targetTask.title,
              description: targetTask.description,
              dueDate: targetTask.dueDate,
            },
          });
        }
      } else if (
        canCreateAssessmentDeadlineTask(
          latestResolvedBySourceId.get(sourceId),
          targetTask,
        )
      ) {
        await tx.task.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            origin: targetTask.origin,
            workflowSourceId: targetTask.sourceId,
            workflowStage: targetTask.stage,
            workflowEventKind: targetTask.kind,
            workflowEventAt: targetTask.eventAt,
            title: targetTask.title,
            description: targetTask.description,
            dueDate: targetTask.dueDate,
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

    const offerSourceId = "offer";
    const offerDeadlineTask = buildOfferExpirationTask(application);
    const offerTasks = openTasksBySourceId.get(offerSourceId) ?? [];
    const [primaryOfferTask, ...duplicateOfferTasks] = offerTasks;

    if (offerDeadlineTask) {
      activeSourceIds.add(offerSourceId);

      if (primaryOfferTask) {
        if (!isSameWorkflowTask(primaryOfferTask, offerDeadlineTask)) {
          await tx.task.update({
            where: {
              id: primaryOfferTask.id,
            },
            data: {
              title: offerDeadlineTask.title,
              description: offerDeadlineTask.description,
              dueDate: offerDeadlineTask.dueDate,
              workflowSourceId: offerDeadlineTask.sourceId,
              workflowStage: offerDeadlineTask.stage,
              workflowEventKind: offerDeadlineTask.kind,
              workflowEventAt: offerDeadlineTask.eventAt,
            },
          });
        } else {
          await tx.task.update({
            where: {
              id: primaryOfferTask.id,
            },
            data: {
              title: offerDeadlineTask.title,
              description: offerDeadlineTask.description,
              dueDate: offerDeadlineTask.dueDate,
            },
          });
        }
      } else if (
        canCreateAssessmentDeadlineTask(
          latestResolvedBySourceId.get(offerSourceId),
          offerDeadlineTask,
        )
      ) {
        await tx.task.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            origin: offerDeadlineTask.origin,
            workflowSourceId: offerDeadlineTask.sourceId,
            workflowStage: offerDeadlineTask.stage,
            workflowEventKind: offerDeadlineTask.kind,
            workflowEventAt: offerDeadlineTask.eventAt,
            title: offerDeadlineTask.title,
            description: offerDeadlineTask.description,
            dueDate: offerDeadlineTask.dueDate,
          },
        });
      }
    }

    if (duplicateOfferTasks.length > 0) {
      await tx.task.deleteMany({
        where: {
          id: {
            in: duplicateOfferTasks.map((task) => task.id),
          },
        },
      });
    }
  }

  const obsoleteTaskIds = openAutoDeadlineTasks
    .filter((task) => !task.workflowSourceId || !activeSourceIds.has(task.workflowSourceId))
    .map((task) => task.id);

  if (obsoleteTaskIds.length > 0) {
    await tx.task.deleteMany({
      where: {
        id: {
          in: obsoleteTaskIds,
        },
      },
    });
  }
}

async function syncInterviewPrepTasks(
  tx: Prisma.TransactionClient,
  application: WorkflowApplication,
) {
  const openAutoPrepTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      archivedAt: null,
      completed: false,
      origin: "auto_prep",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventKind: true,
      workflowEventAt: true,
    },
  });

  const resolvedAutoPrepTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      origin: "auto_prep",
      OR: [
        {
          completed: true,
        },
        {
          archivedAt: {
            not: null,
          },
        },
      ],
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        archivedAt: "desc",
      },
    ],
    select: {
      id: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventAt: true,
    },
  });

  const openTasksByKey = new Map<string, typeof openAutoPrepTasks>();

  for (const task of openAutoPrepTasks) {
    const key = getWorkflowSourceKey(task.workflowSourceId, task.workflowStage ?? "interview_prep_lead");
    const existingTasks = openTasksByKey.get(key) ?? [];
    existingTasks.push(task);
    openTasksByKey.set(key, existingTasks);
  }

  const latestResolvedByKey = new Map<
    string,
    (typeof resolvedAutoPrepTasks)[number]
  >();

  for (const task of resolvedAutoPrepTasks) {
    const key = getWorkflowSourceKey(task.workflowSourceId, task.workflowStage ?? "interview_prep_lead");

    if (latestResolvedByKey.has(key)) {
      continue;
    }

    latestResolvedByKey.set(key, task);
  }

  const activeKeys = new Set<string>();

  for (const interview of application.interviews) {
    const targetTasks = buildInterviewPrepTasks(application, interview);

    for (const targetTask of targetTasks) {
      const key = getWorkflowSourceKey(targetTask.sourceId, targetTask.stage);
      const sourceTasks = openTasksByKey.get(key) ?? [];
      const [primaryTask, ...duplicateTasks] = sourceTasks;

      activeKeys.add(key);

      if (primaryTask) {
        if (!isSameWorkflowTask(primaryTask, targetTask)) {
          await tx.task.update({
            where: {
              id: primaryTask.id,
            },
            data: {
              title: targetTask.title,
              description: targetTask.description,
              dueDate: targetTask.dueDate,
              workflowSourceId: targetTask.sourceId,
              workflowStage: targetTask.stage,
              workflowEventKind: targetTask.kind,
              workflowEventAt: targetTask.eventAt,
            },
          });
        } else {
          await tx.task.update({
            where: {
              id: primaryTask.id,
            },
            data: {
              title: targetTask.title,
              description: targetTask.description,
              dueDate: targetTask.dueDate,
            },
          });
        }
      } else if (
        canCreateScheduledPrepTask(latestResolvedByKey.get(key), targetTask)
      ) {
        await tx.task.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            origin: targetTask.origin,
            workflowSourceId: targetTask.sourceId,
            workflowStage: targetTask.stage,
            workflowEventKind: targetTask.kind,
            workflowEventAt: targetTask.eventAt,
            title: targetTask.title,
            description: targetTask.description,
            dueDate: targetTask.dueDate,
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
  }

  const offerReviewTask = buildOfferReviewTask(application);

  if (offerReviewTask) {
    const key = getWorkflowSourceKey(
      offerReviewTask.sourceId,
      offerReviewTask.stage,
    );
    const sourceTasks = openTasksByKey.get(key) ?? [];
    const [primaryTask, ...duplicateTasks] = sourceTasks;

    activeKeys.add(key);

    if (primaryTask) {
      if (!isSameWorkflowTask(primaryTask, offerReviewTask)) {
        await tx.task.update({
          where: {
            id: primaryTask.id,
          },
          data: {
            title: offerReviewTask.title,
            description: offerReviewTask.description,
            dueDate: offerReviewTask.dueDate,
            workflowSourceId: offerReviewTask.sourceId,
            workflowStage: offerReviewTask.stage,
            workflowEventKind: offerReviewTask.kind,
            workflowEventAt: offerReviewTask.eventAt,
          },
        });
      } else {
        await tx.task.update({
          where: {
            id: primaryTask.id,
          },
          data: {
            title: offerReviewTask.title,
            description: offerReviewTask.description,
            dueDate: offerReviewTask.dueDate,
          },
        });
      }
    } else if (
      canCreateScheduledPrepTask(latestResolvedByKey.get(key), offerReviewTask)
    ) {
      await tx.task.create({
        data: {
          userId: application.userId,
          applicationId: application.id,
          origin: offerReviewTask.origin,
          workflowSourceId: offerReviewTask.sourceId,
          workflowStage: offerReviewTask.stage,
          workflowEventKind: offerReviewTask.kind,
          workflowEventAt: offerReviewTask.eventAt,
          title: offerReviewTask.title,
          description: offerReviewTask.description,
          dueDate: offerReviewTask.dueDate,
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

  const obsoleteTaskIds = openAutoPrepTasks
    .filter((task) => {
      const key = getWorkflowSourceKey(
        task.workflowSourceId,
        task.workflowStage ?? "interview_prep_lead",
      );

      return !activeKeys.has(key);
    })
    .map((task) => task.id);

  if (obsoleteTaskIds.length > 0) {
    await tx.task.deleteMany({
      where: {
        id: {
          in: obsoleteTaskIds,
        },
      },
    });
  }
}

async function syncInterviewReflectionTasks(
  tx: Prisma.TransactionClient,
  application: WorkflowApplication,
) {
  const openAutoReviewTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      archivedAt: null,
      completed: false,
      origin: "auto_review",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventKind: true,
      workflowEventAt: true,
    },
  });

  const resolvedAutoReviewTasks = await tx.task.findMany({
    where: {
      userId: application.userId,
      applicationId: application.id,
      origin: "auto_review",
      OR: [
        {
          completed: true,
        },
        {
          archivedAt: {
            not: null,
          },
        },
      ],
    },
    orderBy: [
      {
        updatedAt: "desc",
      },
      {
        archivedAt: "desc",
      },
    ],
    select: {
      id: true,
      workflowSourceId: true,
      workflowStage: true,
      workflowEventAt: true,
    },
  });

  const openTasksByKey = new Map<string, typeof openAutoReviewTasks>();

  for (const task of openAutoReviewTasks) {
    const key = getWorkflowSourceKey(
      task.workflowSourceId,
      task.workflowStage ?? "interview_reflection",
    );
    const existingTasks = openTasksByKey.get(key) ?? [];
    existingTasks.push(task);
    openTasksByKey.set(key, existingTasks);
  }

  const latestResolvedByKey = new Map<
    string,
    (typeof resolvedAutoReviewTasks)[number]
  >();

  for (const task of resolvedAutoReviewTasks) {
    const key = getWorkflowSourceKey(
      task.workflowSourceId,
      task.workflowStage ?? "interview_reflection",
    );

    if (latestResolvedByKey.has(key)) {
      continue;
    }

    latestResolvedByKey.set(key, task);
  }

  const activeKeys = new Set<string>();

  for (const interview of application.interviews) {
    const targetTasks = buildInterviewReviewTasks(application, interview);

    for (const targetTask of targetTasks) {
      const key = getWorkflowSourceKey(targetTask.sourceId, targetTask.stage);
      const sourceTasks = openTasksByKey.get(key) ?? [];
      const [primaryTask, ...duplicateTasks] = sourceTasks;

      activeKeys.add(key);

      if (primaryTask) {
        if (!isSameWorkflowTask(primaryTask, targetTask)) {
          await tx.task.update({
            where: {
              id: primaryTask.id,
            },
            data: {
              title: targetTask.title,
              description: targetTask.description,
              dueDate: targetTask.dueDate,
              workflowSourceId: targetTask.sourceId,
              workflowStage: targetTask.stage,
              workflowEventKind: targetTask.kind,
              workflowEventAt: targetTask.eventAt,
            },
          });
        } else {
          await tx.task.update({
            where: {
              id: primaryTask.id,
            },
            data: {
              title: targetTask.title,
              description: targetTask.description,
              dueDate: targetTask.dueDate,
            },
          });
        }
      } else if (
        canCreateScheduledPrepTask(latestResolvedByKey.get(key), targetTask)
      ) {
        await tx.task.create({
          data: {
            userId: application.userId,
            applicationId: application.id,
            origin: targetTask.origin,
            workflowSourceId: targetTask.sourceId,
            workflowStage: targetTask.stage,
            workflowEventKind: targetTask.kind,
            workflowEventAt: targetTask.eventAt,
            title: targetTask.title,
            description: targetTask.description,
            dueDate: targetTask.dueDate,
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
  }

  const obsoleteTaskIds = openAutoReviewTasks
    .filter((task) => {
      const key = getWorkflowSourceKey(
        task.workflowSourceId,
        task.workflowStage ?? "interview_reflection",
      );

      return !activeKeys.has(key);
    })
    .map((task) => task.id);

  if (obsoleteTaskIds.length > 0) {
    await tx.task.deleteMany({
      where: {
        id: {
          in: obsoleteTaskIds,
        },
      },
    });
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

export function getOfferReceivedAtForWorkflow(
  currentOfferReceivedAt: Date | null,
  previousStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
) {
  if (nextStatus !== "OFFER") {
    return currentOfferReceivedAt;
  }

  if (currentOfferReceivedAt && previousStatus === "OFFER") {
    return currentOfferReceivedAt;
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
      offerReceivedAt: true,
      offerExpiresAt: true,
      updatedAt: true,
      user: {
        select: {
          autoThankYouReminderEnabled: true,
        },
      },
      interviews: {
        select: {
          id: true,
          type: true,
          stageName: true,
          scheduledAt: true,
          interviewerName: true,
          locationOrLink: true,
          outcome: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      notes: {
        select: {
          id: true,
          title: true,
          content: true,
          assessmentDueDate: true,
          assessmentSubmittedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!application) {
    return;
  }

  await syncAutoFollowUpTasks(tx, application);
  await syncAssessmentDeadlineTasks(tx, application);
  await syncInterviewPrepTasks(tx, application);
  await syncInterviewReflectionTasks(tx, application);
}

export async function syncUserApplicationWorkflowTasks(
  prisma: PrismaClient,
  userId: string,
) {
  const applications = await prisma.jobApplication.findMany({
    where: {
      userId,
      archivedAt: null,
    },
    select: {
      id: true,
    },
  });

  if (applications.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const application of applications) {
      await syncApplicationWorkflowTask(tx, application.id);
    }
  });
}
