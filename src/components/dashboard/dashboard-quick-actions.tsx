"use client";

import Link from "next/link";
import { useState } from "react";
import { DashboardTaskQuickAdd } from "./dashboard-task-quick-add";
import { DashboardCallUpQuickAdd } from "./dashboard-call-up-quick-add";
import { DashboardContactQuickAdd } from "./dashboard-contact-quick-add";

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
          className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
        >
          <PlusIcon />
          <span>Contact</span>
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
    </>
  );
}
