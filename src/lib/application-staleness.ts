const WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

export const STALE_WARNING_WEEKS = 4;
export const STALE_INACTIVE_WEEKS = 6;
export const STALE_ARCHIVE_WEEKS = 8;

const CLOSED_APPLICATION_STATUSES = new Set([
  "REJECTED",
  "WITHDRAWN",
  "HIRED",
  "OFFER_ACCEPTED_ELSEWHERE",
]);

type ActivityDateValue = string | Date | null | undefined;

type ActivityInterview = {
  scheduledAt?: ActivityDateValue;
  createdAt: ActivityDateValue;
  updatedAt?: ActivityDateValue;
};

type ActivityNote = {
  createdAt: ActivityDateValue;
  updatedAt?: ActivityDateValue;
};

type ApplicationStalenessInput = {
  status: string;
  createdAt: ActivityDateValue;
  updatedAt?: ActivityDateValue;
  archivedAt?: ActivityDateValue;
  offerReceivedAt?: ActivityDateValue;
  offerExpiresAt?: ActivityDateValue;
  interviews?: ActivityInterview[];
  notes?: ActivityNote[];
};

export type ApplicationStalenessLevel = "warning" | "stale" | "archive";

export type ApplicationStaleness = {
  level: ApplicationStalenessLevel;
  label: string;
  description: string;
  weeksSinceActivity: number;
  lastMeaningfulActivityAt: Date;
};

function toDate(value: ActivityDateValue) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function getLatestMeaningfulApplicationActivityAt(
  application: ApplicationStalenessInput,
) {
  const activityDates = [
    toDate(application.updatedAt),
    toDate(application.createdAt),
    toDate(application.offerReceivedAt),
    toDate(application.offerExpiresAt),
    ...(application.interviews ?? []).flatMap((interview) => [
      toDate(interview.createdAt),
      toDate(interview.updatedAt),
      toDate(interview.scheduledAt),
    ]),
    ...(application.notes ?? []).flatMap((note) => [
      toDate(note.createdAt),
      toDate(note.updatedAt),
    ]),
  ].filter((value): value is Date => value !== null);

  return activityDates.sort((a, b) => b.getTime() - a.getTime())[0] ?? null;
}

export function getApplicationStaleness(
  application: ApplicationStalenessInput,
  now = new Date(),
): ApplicationStaleness | null {
  if (toDate(application.archivedAt)) {
    return null;
  }

  if (CLOSED_APPLICATION_STATUSES.has(application.status)) {
    return null;
  }

  const lastMeaningfulActivityAt =
    getLatestMeaningfulApplicationActivityAt(application);

  if (!lastMeaningfulActivityAt) {
    return null;
  }

  const activityAgeMs = now.getTime() - lastMeaningfulActivityAt.getTime();

  if (activityAgeMs < STALE_WARNING_WEEKS * WEEK_IN_MS) {
    return null;
  }

  const weeksSinceActivity = Math.max(
    1,
    Math.floor(activityAgeMs / WEEK_IN_MS),
  );

  if (activityAgeMs >= STALE_ARCHIVE_WEEKS * WEEK_IN_MS) {
    return {
      level: "archive",
      label: "Suggest archive",
      description: `No meaningful update for ${weeksSinceActivity} weeks.`,
      weeksSinceActivity,
      lastMeaningfulActivityAt,
    };
  }

  if (activityAgeMs >= STALE_INACTIVE_WEEKS * WEEK_IN_MS) {
    return {
      level: "stale",
      label: "Probably inactive",
      description: `No meaningful update for ${weeksSinceActivity} weeks.`,
      weeksSinceActivity,
      lastMeaningfulActivityAt,
    };
  }

  return {
    level: "warning",
    label: "Needs attention",
    description: `No meaningful update for ${weeksSinceActivity} weeks.`,
    weeksSinceActivity,
    lastMeaningfulActivityAt,
  };
}
