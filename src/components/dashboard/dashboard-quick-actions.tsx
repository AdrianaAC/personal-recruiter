"use client";

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

export function DashboardQuickActions({ applications, contacts }: Props) {
  const [openTask, setOpenTask] = useState(false);
  const [openCall, setOpenCall] = useState(false);
  const [openContact, setOpenContact] = useState(false);

  return (
    <>
      <div className="flex gap-3">
        <button
          onClick={() => setOpenTask(true)}
          className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
        >
          + Task
        </button>

        <button
          onClick={() => setOpenCall(true)}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-900 hover:bg-gray-300"
        >
          + Call-Up
        </button>

        <button
          onClick={() => setOpenContact(true)}
          className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-900 hover:bg-gray-300"
        >
          + Contact
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
