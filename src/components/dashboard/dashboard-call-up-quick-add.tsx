"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  open: boolean;
  onClose: () => void;
  applications: ApplicationOption[];
  contacts: ContactOption[];
};

export function DashboardCallUpQuickAdd({
  open,
  onClose,
  applications,
  contacts,
}: Props) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [applicationId, setApplicationId] = useState("");
  const [contactId, setContactId] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!contactId) {
      alert("Please choose a contact.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/call-ups", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        scheduledAt: scheduledAt || undefined,
        applicationId: applicationId || null,
        contactId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const errorText = await res.text();
      console.error(errorText);
      alert("Failed to create FollowUp.");
      return;
    }

    setTitle("");
    setScheduledAt("");
    setApplicationId("");
    setContactId("");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">New FollowUp</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            placeholder="FollowUp title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="">Choose a contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName}
                {contact.companyName ? ` — ${contact.companyName}` : ""}
                {contact.jobTitle ? ` (${contact.jobTitle})` : ""}
              </option>
            ))}
          </select>

          <select
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">No application (standalone FollowUp)</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.companyName} — {application.roleTitle}
              </option>
            ))}
          </select>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-sm text-gray-600"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="rounded-md bg-black px-4 py-2 text-sm text-white"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
