type InterviewItem = {
  id: string;
  type: string;
  stageName: string | null;
  scheduledAt: string | Date | null;
  durationMinutes: number | null;
  interviewerName: string | null;
  interviewerRole: string | null;
  locationOrLink: string | null;
  outcome: string | null;
  notes: string | null;
};

type Props = {
  interview: InterviewItem | null;
};

function formatDate(value: string | Date | null) {
  if (!value) return null;

  const date = typeof value === "string" ? new Date(value) : value;

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ApplicationNextInterview({ interview }: Props) {
  if (!interview) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">Next Interview</h2>

        <p className="mt-3 text-sm text-gray-600">
          No upcoming interviews scheduled.
        </p>
      </section>
    );
  }

  const formattedDate = formatDate(interview.scheduledAt);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Next Interview</h2>

      <div className="mt-4 space-y-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            {interview.stageName || "Untitled stage"}
          </h3>

          <p className="text-sm text-gray-600">{interview.type}</p>
        </div>

        {formattedDate && (
          <p className="text-sm text-gray-800">
            📅 {formattedDate}
            {interview.durationMinutes
              ? ` • ${interview.durationMinutes} min`
              : ""}
          </p>
        )}

        {(interview.interviewerName || interview.interviewerRole) && (
          <p className="text-sm text-gray-700">
            👤 {interview.interviewerName || "Unknown"}
            {interview.interviewerRole
              ? ` — ${interview.interviewerRole}`
              : ""}
          </p>
        )}

        {interview.locationOrLink && (
          <div>
            <p className="text-sm text-gray-700">📍 Location</p>
            <a
              href={interview.locationOrLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-blue-600 underline break-all"
            >
              {interview.locationOrLink}
            </a>
          </div>
        )}

        {interview.notes && (
          <div>
            <p className="text-sm text-gray-500">Notes</p>
            <p className="text-sm text-gray-800 line-clamp-3">
              {interview.notes}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}