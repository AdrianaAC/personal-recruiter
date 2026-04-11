"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardTaskQuickAdd } from "./dashboard-task-quick-add";
import { DashboardCallUpQuickAdd } from "./dashboard-call-up-quick-add";
import { DashboardContactQuickAdd } from "./dashboard-contact-quick-add";
import { DashboardInterviewQuickAdd } from "./dashboard-interview-quick-add";

type ApplicationOption = {
  id: string;
  companyName: string;
  roleTitle: string;
};

type ContactOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobTitle: string | null;
};

type Props = {
  applications: ApplicationOption[];
  contacts: ContactOption[];
};

function EventChooserModal({
  onClose,
  onChoose,
}: {
  onClose: () => void;
  onChoose: (mode: "task" | "followup" | "interview") => void;
}) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-3xl border border-violet-200 bg-white p-5 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-violet-600">
          Calendar Event
        </p>
        <h3 className="mt-2 text-xl font-semibold text-slate-950">
          Add Something New
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Choose which kind of event you want to place on your calendar.
        </p>

        <div className="mt-5 grid gap-3">
          <button
            type="button"
            onClick={() => onChoose("task")}
            className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
          >
            Add task
          </button>

          <button
            type="button"
            onClick={() => onChoose("interview")}
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left text-sm font-semibold text-indigo-900 transition hover:bg-indigo-100"
          >
            Add interview
          </button>

          <button
            type="button"
            onClick={() => onChoose("followup")}
            className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-left text-sm font-semibold text-sky-900 transition hover:bg-sky-100"
          >
            Add FollowUp
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-slate-500"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      className="h-4 w-4"
    >
      <path d="M10 4.5v11" />
      <path d="M4.5 10h11" />
    </svg>
  );
}

export function DashboardQuickActions({ applications, contacts }: Props) {
  const [openTask, setOpenTask] = useState(false);
  const [openCall, setOpenCall] = useState(false);
  const [openContact, setOpenContact] = useState(false);
  const [openInterview, setOpenInterview] = useState(false);
  const [openEventChooser, setOpenEventChooser] = useState(false);

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Link
          href="/dashboard/applications/new"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-emerald-100 px-5 py-2.5 text-sm font-bold text-emerald-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-200"
        >
          <PlusIcon />
          <span>Application</span>
        </Link>

        <button
          onClick={() => setOpenTask(true)}
          className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-100 px-5 py-2.5 text-sm font-bold text-amber-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-200"
        >
          <PlusIcon />
          <span>Task</span>
        </button>

        <button
          onClick={() => setOpenCall(true)}
          className="inline-flex items-center gap-2 rounded-full border border-sky-300 bg-sky-100 px-5 py-2.5 text-sm font-bold text-sky-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-sky-200"
        >
          <PlusIcon />
          <span>FollowUp</span>
        </button>

        <button
          onClick={() => setOpenContact(true)}
          className="inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-100 px-5 py-2.5 text-sm font-bold text-rose-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-rose-200"
        >
          <PlusIcon />
          <span>Contact</span>
        </button>

        <button
          type="button"
          onClick={() => setOpenEventChooser(true)}
          className="inline-flex items-center gap-2 rounded-full border border-violet-300 bg-violet-100 px-5 py-2.5 text-sm font-bold text-violet-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-200"
        >
          <PlusIcon />
          <span>Event</span>
        </button>
      </div>

      <DashboardTaskQuickAdd
        open={openTask}
        onClose={() => setOpenTask(false)}
        applications={applications}
      />

      <DashboardCallUpQuickAdd
        open={openCall}
        onClose={() => setOpenCall(false)}
        applications={applications}
        contacts={contacts}
      />

      <DashboardContactQuickAdd
        open={openContact}
        onClose={() => setOpenContact(false)}
      />

      <DashboardInterviewQuickAdd
        open={openInterview}
        onClose={() => setOpenInterview(false)}
        applications={applications}
      />

      {openEventChooser ? (
        <EventChooserModal
          onClose={() => setOpenEventChooser(false)}
          onChoose={(mode) => {
            setOpenEventChooser(false);

            if (mode === "task") {
              setOpenTask(true);
              return;
            }

            if (mode === "followup") {
              setOpenCall(true);
              return;
            }

            setOpenInterview(true);
          }}
        />
      ) : null}
    </>
  );
}
