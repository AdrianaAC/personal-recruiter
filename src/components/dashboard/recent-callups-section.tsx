import Link from "next/link";

type RecentCallUp = {
  id: string;
  role: string;
  updatedAt: string | Date;
  contact: {
    fullName: string;
    email: string | null;
    linkedinUrl: string | null;
    companyName: string | null;
    jobTitle: string | null;
  };
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
  };
};

type RecentCallUpsSectionProps = {
  callUps: RecentCallUp[];
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleDateString();
}

export function RecentCallUpsSection({
  callUps,
}: RecentCallUpsSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-sky-50/60 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            Recent Call-Ups
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Recruiters, hiring managers, and contacts worth keeping warm.
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {callUps.length} visible
        </span>
      </div>

      {callUps.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">
            No call-ups yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Attach contacts to applications so the people around each role stay
            visible.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {callUps.map((callUp) => (
            <div
              key={callUp.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {callUp.contact.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {callUp.contact.jobTitle || formatLabel(callUp.role)}
                      {callUp.contact.companyName
                        ? ` • ${callUp.contact.companyName}`
                        : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-900 ring-1 ring-sky-300">
                    {formatLabel(callUp.role)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-300">
                    {callUp.application.companyName}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-300">
                    {callUp.application.roleTitle}
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-black ring-1 ring-black/20">
                    Updated {formatDate(callUp.updatedAt)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {callUp.contact.email ? (
                    <a
                      href={`mailto:${callUp.contact.email}`}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                    >
                      Email
                    </a>
                  ) : null}

                  {callUp.contact.linkedinUrl ? (
                    <a
                      href={callUp.contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      LinkedIn
                    </a>
                  ) : null}

                  <Link
                    href={`/dashboard/applications/${callUp.application.id}`}
                    className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open application
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
