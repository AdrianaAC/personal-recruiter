type ApplicationSummaryCardsProps = {
  status: string | null;
  notesCount: number;
  openTasksCount: number;
  completedTasksCount: number;
  interviewsCount: number;
  nextInterviewAt: string | Date | null;
};

function formatNextInterview(value: string | Date | null) {
  if (!value) return "No interview scheduled";

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusLabel(status: string | null) {
  if (!status) return "No status";
  return status.replaceAll("_", " ");
}

export function ApplicationSummaryCards({
  status,
  notesCount,
  openTasksCount,
  completedTasksCount,
  interviewsCount,
  nextInterviewAt,
}: ApplicationSummaryCardsProps) {
  const cards = [
    {
      title: "Status",
      value: getStatusLabel(status),
      helper: "Current application stage",
    },
    {
      title: "Notes",
      value: String(notesCount),
      helper: "Saved notes",
    },
    {
      title: "Open tasks",
      value: String(openTasksCount),
      helper: "Still to do",
    },
    {
      title: "Completed tasks",
      value: String(completedTasksCount),
      helper: "Already done",
    },
    {
      title: "Interviews",
      value: String(interviewsCount),
      helper: "Total interviews",
    },
    {
      title: "Next interview",
      value: formatNextInterview(nextInterviewAt),
      helper: "Upcoming scheduled step",
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-gray-500">{card.title}</p>
          <p className="mt-2 text-lg font-semibold text-gray-900">{card.value}</p>
          <p className="mt-1 text-sm text-gray-600">{card.helper}</p>
        </div>
      ))}
    </section>
  );
}