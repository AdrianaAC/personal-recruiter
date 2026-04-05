type TimelineItem = {
  id: string;
  kind: "application" | "note" | "task" | "interview";
  title: string;
  description?: string | null;
  timestamp: string | Date;
  meta?: string | null;
};

type ApplicationActivityTimelineProps = {
  items: TimelineItem[];
};

function formatTimelineDate(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getKindBadge(kind: TimelineItem["kind"]) {
  switch (kind) {
    case "application":
      return "Application";
    case "note":
      return "Note";
    case "task":
      return "Task";
    case "interview":
      return "Interview";
    default:
      return "Activity";
  }
}

export function ApplicationActivityTimeline({
  items,
}: ApplicationActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
        <p className="mt-3 text-sm text-gray-600">No activity yet.</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Activity Timeline</h2>
          <p className="mt-1 text-sm text-gray-600">
            A chronological view of what happened in this application.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="relative pl-6">
            {index !== items.length - 1 ? (
              <div className="absolute left-[9px] top-6 h-[calc(100%+0.75rem)] w-px bg-gray-200" />
            ) : null}

            <div className="absolute left-0 top-1 h-[18px] w-[18px] rounded-full border border-gray-300 bg-white" />

            <div className="rounded-lg bg-gray-50 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                  {getKindBadge(item.kind)}
                </span>

                <span className="text-xs text-gray-500">
                  {formatTimelineDate(item.timestamp)}
                </span>
              </div>

              <h3 className="mt-2 text-sm font-semibold text-gray-900">
                {item.title}
              </h3>

              {item.meta ? (
                <p className="mt-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                  {item.meta}
                </p>
              ) : null}

              {item.description ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {item.description}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}