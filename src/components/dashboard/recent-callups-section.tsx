"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RecentCallUp = {
  id: string;
  title: string;
  notes: string | null;
  scheduledAt: string | Date | null;
  status: "PLANNED" | "DONE" | "MISSED";
  updatedAt: string | Date;
  contact: {
    id: string;
    fullName: string;
    email: string | null;
    linkedinUrl: string | null;
    companyName: string | null;
    jobTitle: string | null;
  } | null;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
  } | null;
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

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleDateString();
}

function CallUpActions({ callUpId }: { callUpId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);

    const res = await fetch(`/api/call-ups/${callUpId}`, {
      method: "PATCH",
    });

    setLoading(false);

    if (!res.ok) {
      alert("Failed to update call-up.");
      return;
    }

    router.refresh();
  }

  return (
    <details className="relative">
      <summary className="list-none cursor-pointer rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50">
        {loading ? "Updating..." : "Actions"}
      </summary>

      <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
        <button
          type="button"
          onClick={markComplete}
          disabled={loading}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
        >
          Mark as complete
        </button>
      </div>
    </details>
  );
}

function getStatusClass(status: RecentCallUp["status"]) {
  if (status === "DONE") {
    return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300";
  }

  if (status === "MISSED") {
    return "bg-rose-100 text-rose-900 ring-1 ring-rose-300";
  }

  return "bg-sky-100 text-sky-900 ring-1 ring-sky-300";
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
            Add call-ups from the dashboard and attach them to a real contact.
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
                      {callUp.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {callUp.scheduledAt
                        ? `Scheduled ${formatDate(callUp.scheduledAt)}`
                        : "No scheduled date"}
                    </p>
                  </div>

                  <CallUpActions callUpId={callUp.id} />
                </div>

                <p className="text-sm text-slate-600">
                  {callUp.contact?.fullName ?? "Unknown contact"}
                  {callUp.contact?.jobTitle ? ` • ${callUp.contact.jobTitle}` : ""}
                  {callUp.contact?.companyName
                    ? ` • ${callUp.contact.companyName}`
                    : ""}
                </p>

                {callUp.notes ? (
                  <p className="text-sm text-slate-600">{callUp.notes}</p>
                ) : null}

                <div className="flex flex-wrap gap-2 text-xs text-slate-600">
                  <span
                    className={`rounded-full px-2.5 py-1 font-medium ${getStatusClass(callUp.status)}`}
                  >
                    {formatLabel(callUp.status)}
                  </span>

                  {callUp.application ? (
                    <>
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-300">
                        {callUp.application.companyName}
                      </span>
                      <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-300">
                        {callUp.application.roleTitle}
                      </span>
                    </>
                  ) : (
                    <span className="rounded-full bg-white px-2.5 py-1 ring-1 ring-slate-300">
                      Standalone call-up
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {callUp.contact?.email ? (
                    <a
                      href={`mailto:${callUp.contact.email}`}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
                    >
                      Email
                    </a>
                  ) : null}

                  {callUp.contact?.linkedinUrl ? (
                    <a
                      href={callUp.contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                    >
                      LinkedIn
                    </a>
                  ) : null}

                  {callUp.application ? (
                    <Link
                      href={`/dashboard/applications/${callUp.application.id}`}
                      className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Open application
                    </Link>
                  ) : (
                    <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                      General call-up
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}