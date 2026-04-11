const DAY_IN_MS = 24 * 60 * 60 * 1000;
const INTERVIEW_WORKLOAD_THRESHOLD = 5;
const ASSESSMENT_CLUSTER_THRESHOLD = 2;
const ASSESSMENT_CLUSTER_WINDOW_DAYS = 7;
const OFFER_DECISION_WINDOW_DAYS = 7;

type ConflictInterview = {
  type?: string | null;
  stageName?: string | null;
  scheduledAt?: string | Date | null;
  outcome?: string | null;
};

type ConflictAssessment = {
  title?: string | null;
  assessmentDueDate?: string | Date | null;
  assessmentSubmittedAt?: string | Date | null;
};

type ConflictApplication = {
  id: string;
  companyName: string;
  roleTitle: string;
  status: string;
  offerExpiresAt?: string | Date | null;
  interviews?: ConflictInterview[];
  notes?: ConflictAssessment[];
};

export type DashboardConflictAlert = {
  id: string;
  label: string;
  title: string;
  description: string;
  meta: string;
  classes: string;
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

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
  }).format(value);
}

function formatWeekLabel(value: Date) {
  return `Week of ${formatDate(value)}`;
}

function joinCompanyNames(companyNames: string[]) {
  const uniqueNames = [...new Set(companyNames)];

  if (uniqueNames.length <= 2) {
    return uniqueNames.join(", ");
  }

  return `${uniqueNames.slice(0, 2).join(", ")} +${uniqueNames.length - 2} more`;
}

function getInterviewWorkloadAlert(
  applications: ConflictApplication[],
  now: Date,
): DashboardConflictAlert | null {
  const upcomingInterviews = applications.flatMap((application) =>
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
          interview.scheduledAt.getTime() >= startOfDay(now).getTime() &&
          interview.outcome !== "CANCELLED",
      ),
  );

  const groupedWeeks = new Map<
    string,
    {
      weekStart: Date;
      companyNames: string[];
      count: number;
    }
  >();

  for (const interview of upcomingInterviews) {
    const weekStart = startOfWeek(interview.scheduledAt);
    const key = weekStart.toISOString();
    const existing =
      groupedWeeks.get(key) ??
      {
        weekStart,
        companyNames: [],
        count: 0,
      };

    existing.count += 1;
    existing.companyNames.push(interview.companyName);
    groupedWeeks.set(key, existing);
  }

  const overloadedWeek = [...groupedWeeks.values()]
    .filter((week) => week.count >= INTERVIEW_WORKLOAD_THRESHOLD)
    .sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }

      return a.weekStart.getTime() - b.weekStart.getTime();
    })[0];

  if (!overloadedWeek) {
    return null;
  }

  return {
    id: "conflict-interviews",
    label: "Workload Warning",
    title: `${overloadedWeek.count} interviews in one week`,
    description: `That week stacks interviews across ${joinCompanyNames(overloadedWeek.companyNames)}.`,
    meta: formatWeekLabel(overloadedWeek.weekStart),
    classes:
      "border-amber-300 bg-gradient-to-br from-amber-100/80 via-white to-white",
  };
}

function getAssessmentPriorityAlert(
  applications: ConflictApplication[],
  now: Date,
): DashboardConflictAlert | null {
  const pendingAssessments = applications
    .flatMap((application) =>
      (application.notes ?? []).map((note) => ({
        companyName: application.companyName,
        roleTitle: application.roleTitle,
        title: note.title ?? null,
        dueDate: toDate(note.assessmentDueDate),
        submittedAt: toDate(note.assessmentSubmittedAt),
      })),
    )
    .filter(
      (assessment): assessment is {
        companyName: string;
        roleTitle: string;
        title: string | null;
        dueDate: Date;
        submittedAt: Date | null;
      } =>
        assessment.dueDate !== null &&
        assessment.submittedAt === null &&
        assessment.dueDate.getTime() >= startOfDay(now).getTime(),
    )
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  let bestCluster:
    | {
        assessments: typeof pendingAssessments;
        start: Date;
        end: Date;
      }
    | null = null;

  for (let index = 0; index < pendingAssessments.length; index += 1) {
    const windowStart = pendingAssessments[index].dueDate.getTime();
    const cluster = pendingAssessments.filter(
      (assessment) =>
        assessment.dueDate.getTime() >= windowStart &&
        assessment.dueDate.getTime() <=
          windowStart + ASSESSMENT_CLUSTER_WINDOW_DAYS * DAY_IN_MS,
    );

    if (cluster.length < ASSESSMENT_CLUSTER_THRESHOLD) {
      continue;
    }

    if (!bestCluster || cluster.length > bestCluster.assessments.length) {
      bestCluster = {
        assessments: cluster,
        start: cluster[0].dueDate,
        end: cluster[cluster.length - 1].dueDate,
      };
    }
  }

  if (!bestCluster) {
    return null;
  }

  return {
    id: "conflict-assessments",
    label: "Priority Alert",
    title: `${bestCluster.assessments.length} assessments due close together`,
    description: `Priority is stacking across ${joinCompanyNames(
      bestCluster.assessments.map((assessment) => assessment.companyName),
    )}.`,
    meta: `${formatDate(bestCluster.start)} to ${formatDate(bestCluster.end)}`,
    classes:
      "border-rose-300 bg-gradient-to-br from-rose-100/80 via-white to-white",
  };
}

function getDecisionConflictAlert(
  applications: ConflictApplication[],
  now: Date,
): DashboardConflictAlert | null {
  const activeOffers = applications
    .map((application) => ({
      id: application.id,
      companyName: application.companyName,
      roleTitle: application.roleTitle,
      offerExpiresAt: toDate(application.offerExpiresAt),
      status: application.status,
    }))
    .filter(
      (application): application is {
        id: string;
        companyName: string;
        roleTitle: string;
        offerExpiresAt: Date;
        status: string;
      } =>
        application.status === "OFFER" &&
        application.offerExpiresAt !== null &&
        application.offerExpiresAt.getTime() >= startOfDay(now).getTime() &&
        application.offerExpiresAt.getTime() <=
          addDays(startOfDay(now), OFFER_DECISION_WINDOW_DAYS).getTime(),
    )
    .sort((a, b) => a.offerExpiresAt.getTime() - b.offerExpiresAt.getTime());

  for (const offer of activeOffers) {
    const activeFinalRounds = applications.filter((application) => {
      if (application.id === offer.id) {
        return false;
      }

      if (application.status === "FINAL_INTERVIEW") {
        return true;
      }

      return (application.interviews ?? []).some((interview) => {
        const scheduledAt = toDate(interview.scheduledAt);
        const isUpcoming =
          scheduledAt !== null &&
          scheduledAt.getTime() >= startOfDay(now).getTime();
        const hasFinalSignal =
          interview.type === "FINAL" ||
          interview.stageName?.toLowerCase().includes("final");

        return isUpcoming && interview.outcome !== "CANCELLED" && hasFinalSignal;
      });
    });

    if (activeFinalRounds.length === 0) {
      continue;
    }

    return {
      id: "conflict-offer-decision",
      label: "Decision Alert",
      title: `Offer deadline while final rounds stay active`,
      description: `${offer.companyName} expires soon while ${activeFinalRounds.length} other final round${
        activeFinalRounds.length === 1 ? " is" : "s are"
      } still moving.`,
      meta: `Offer expires ${formatDate(offer.offerExpiresAt)}`,
      classes:
        "border-sky-300 bg-gradient-to-br from-sky-100/80 via-white to-white",
    };
  }

  return null;
}

export function getDashboardConflictAlerts(
  applications: ConflictApplication[],
  now = new Date(),
) {
  return [
    getInterviewWorkloadAlert(applications, now),
    getAssessmentPriorityAlert(applications, now),
    getDecisionConflictAlert(applications, now),
  ].filter((alert): alert is DashboardConflictAlert => alert !== null);
}
