import { SpecificDateIndicator } from "@/components/ui/specific-date-indicator";

type CallUpItem = {
  id: string;
  title: string;
  notes: string | null;
  scheduledAt: string | Date | null;
  isSpecificDate?: boolean;
  status: "PLANNED" | "DONE" | "MISSED";
  contact: {
    id: string;
    fullName: string;
    companyName: string | null;
    jobTitle: string | null;
  } | null;
};

type ApplicationCallUpListProps = {
  callUps: CallUpItem[];
};

function formatDate(value: string | Date | null) {
  if (!value) return "No scheduled date";
  return new Date(value).toLocaleDateString();
}

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getStatusClass(status: CallUpItem["status"]) {
  if (status === "DONE") {
    return "bg-green-100 text-green-700";
  }

  if (status === "MISSED") {
    return "bg-red-100 text-red-700";
  }

  return "bg-blue-100 text-blue-700";
}

export function ApplicationCallUpList({
  callUps,
}: ApplicationCallUpListProps) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">FollowUps</h2>
          <p className="mt-1 text-sm text-gray-600">
            FollowUp outreach linked to this application.
          </p>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700">
          {callUps.length} {callUps.length === 1 ? "FollowUp" : "FollowUps"}
        </span>
      </div>

      {callUps.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <h3 className="text-base font-medium">No FollowUps yet</h3>
          <p className="mt-2 text-sm text-gray-600">
            Add your first FollowUp for this application.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {callUps.map((callUp) => (
            <article
              key={callUp.id}
              className="rounded-xl border border-gray-200 bg-gray-50 p-4"
            >
              <div className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-gray-900">
                        {callUp.isSpecificDate ? (
                          <span className="mr-2 inline-flex align-middle">
                            <SpecificDateIndicator className="h-3.5 w-3.5 text-sky-500" />
                          </span>
                        ) : null}
                        {callUp.title}
                      </h3>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getStatusClass(callUp.status)}`}
                      >
                        {formatLabel(callUp.status)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Scheduled: {formatDate(callUp.scheduledAt)}
                    </p>
                  </div>
                </div>

                <p className="text-sm text-gray-700">
                  {callUp.contact?.fullName ?? "No linked contact"}
                  {callUp.contact?.jobTitle ? ` - ${callUp.contact.jobTitle}` : ""}
                  {callUp.contact?.companyName
                    ? ` - ${callUp.contact.companyName}`
                    : ""}
                </p>

                {callUp.notes ? (
                  <div className="whitespace-pre-wrap text-sm text-gray-800">
                    {callUp.notes}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
