import type { ApplicationStalenessLevel } from "@/lib/application-staleness";

type SummaryInterview = {
  scheduledAt?: string | Date | null;
  outcome?: string | null;
};

type SummaryNote = {
  assessmentDueDate?: string | Date | null;
  assessmentSubmittedAt?: string | Date | null;
};

type SummaryApplication = {
  id: string;
  companyName: string;
  roleTitle: string;
  createdAt: string | Date;
  nextStep?: string | null;
  staleLevel?: ApplicationStalenessLevel | null;
  missingNextStepDetected?: boolean;
  interviews?: SummaryInterview[];
  notes?: SummaryNote[];
};

type SummaryFollowUpTask = {
  application: {
    companyName: string;
    roleTitle: string;
  } | null;
};

export type DashboardWeeklySummaryItem = {
  id: string;
  label: string;
  value: number;
  helper: string;
};

export type DashboardWeeklySummary = {
  title: string;
  description: string;
  items: DashboardWeeklySummaryItem[];
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

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

export function getStartOfWeek(date: Date) {
  const nextDate = startOfDay(date);
  const currentDay = nextDate.getDay();
  const diffToMonday = (currentDay + 6) % 7;
  nextDate.setDate(nextDate.getDate() - diffToMonday);
  return nextDate;
}

export function getEndOfWeek(date: Date) {
  return endOfDay(addDays(getStartOfWeek(date), 6));
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(value);
}

function formatCompanyExamples(companyNames: string[]) {
  const uniqueNames = [...new Set(companyNames)];

  if (uniqueNames.length === 0) {
    return "Nothing queued right now.";
  }

  if (uniqueNames.length === 1) {
    return uniqueNames[0];
  }

  if (uniqueNames.length === 2) {
    return `${uniqueNames[0]} and ${uniqueNames[1]}`;
  }

  return `${uniqueNames[0]}, ${uniqueNames[1]}, +${uniqueNames.length - 2} more`;
}

export function getDashboardWeeklySummary(
  applications: SummaryApplication[],
  weeklyFollowUpTasks: SummaryFollowUpTask[],
  now = new Date(),
): DashboardWeeklySummary {
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);

  const interviewsThisWeek = applications.flatMap((application) =>
    (application.interviews ?? [])
      .map((interview) => ({
        companyName: application.companyName,
        scheduledAt: toDate(interview.scheduledAt),
        outcome: interview.outcome ?? null,
      }))
      .filter(
        (interview): interview is {
          companyName: string;
          scheduledAt: Date;
          outcome: string | null;
        } =>
          interview.scheduledAt !== null &&
          interview.outcome !== "CANCELLED" &&
          interview.scheduledAt.getTime() >= weekStart.getTime() &&
          interview.scheduledAt.getTime() <= weekEnd.getTime(),
      ),
  );

  const assessmentsThisWeek = applications.flatMap((application) =>
    (application.notes ?? [])
      .map((note) => ({
        companyName: application.companyName,
        dueDate: toDate(note.assessmentDueDate),
        submittedAt: toDate(note.assessmentSubmittedAt),
      }))
      .filter(
        (assessment): assessment is {
          companyName: string;
          dueDate: Date;
          submittedAt: Date | null;
        } =>
          assessment.dueDate !== null &&
          assessment.submittedAt === null &&
          assessment.dueDate.getTime() >= weekStart.getTime() &&
          assessment.dueDate.getTime() <= weekEnd.getTime(),
      ),
  );

  const staleApplications = applications.filter(
    (application) =>
      application.staleLevel === "warning" ||
      application.staleLevel === "stale" ||
      application.staleLevel === "archive",
  );

  const newOpportunitiesWithoutNextAction = applications.filter((application) => {
    const createdAt = toDate(application.createdAt);

    if (!createdAt) {
      return false;
    }

    return (
      createdAt.getTime() >= weekStart.getTime() &&
      createdAt.getTime() <= weekEnd.getTime() &&
      (application.missingNextStepDetected || !application.nextStep?.trim())
    );
  });

  return {
    title: "Weekly Summary",
    description: `${formatDate(weekStart)} to ${formatDate(weekEnd)}`,
    items: [
      {
        id: "follow-ups",
        label: "Follow-ups this week",
        value: weeklyFollowUpTasks.length,
        helper: formatCompanyExamples(
          weeklyFollowUpTasks
            .map((task) => task.application?.companyName ?? null)
            .filter((value): value is string => value !== null),
        ),
      },
      {
        id: "interviews",
        label: "Interviews this week",
        value: interviewsThisWeek.length,
        helper: formatCompanyExamples(
          interviewsThisWeek.map((interview) => interview.companyName),
        ),
      },
      {
        id: "assessments",
        label: "Assessments due",
        value: assessmentsThisWeek.length,
        helper: formatCompanyExamples(
          assessmentsThisWeek.map((assessment) => assessment.companyName),
        ),
      },
      {
        id: "stale",
        label: "Stale applications",
        value: staleApplications.length,
        helper: formatCompanyExamples(
          staleApplications.map((application) => application.companyName),
        ),
      },
      {
        id: "next-actions",
        label: "New with no next action",
        value: newOpportunitiesWithoutNextAction.length,
        helper: formatCompanyExamples(
          newOpportunitiesWithoutNextAction.map(
            (application) => application.companyName,
          ),
        ),
      },
    ],
  };
}
