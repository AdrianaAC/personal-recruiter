"use client";

import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";

type ApplicationContactOption = {
  id: string;
  fullName: string;
  companyName: string | null;
  jobTitle: string | null;
};

type ApplicationCallUpsProps = {
  applicationId: string;
  contacts: ApplicationContactOption[];
};

type CallUpFormState = {
  title: string;
  notes: string;
  scheduledAt: string;
  contactId: string;
};

const initialFormState: CallUpFormState = {
  title: "",
  notes: "",
  scheduledAt: "",
  contactId: "",
};

async function readJsonSafely(response: Response) {
  return response.json().catch(() => null);
}

export function ApplicationCallUps({
  applicationId,
  contacts,
}: ApplicationCallUpsProps) {
  const router = useRouter();
  const [form, setForm] = useState<CallUpFormState>(initialFormState);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleCreateCallUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/applications/${applicationId}/call-ups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const result = await readJsonSafely(response);

      if (!response.ok) {
        setError(
          result?.error || `Failed to create call-up (${response.status}).`,
        );
        return;
      }

      setForm(initialFormState);
      setSuccess("Call-up created.");
      startTransition(() => {
        router.refresh();
      });
    } catch (err) {
      console.error(err);
      setError("Something went wrong while creating the call-up.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Add Call-Up</h2>
      <p className="mt-1 text-sm text-gray-600">
        Schedule follow-up outreach for this application.
      </p>

      <form onSubmit={handleCreateCallUp} className="mt-4 space-y-4">
        <div className="space-y-2">
          <label htmlFor="call-up-title" className="text-sm font-medium">
            Title *
          </label>
          <input
            id="call-up-title"
            type="text"
            value={form.title}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, title: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="e.g. Follow up with recruiter"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="call-up-notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="call-up-notes"
            value={form.notes}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, notes: event.target.value }))
            }
            className="min-h-[120px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="Optional details about the call-up..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="call-up-date" className="text-sm font-medium">
            Scheduled Date
          </label>
          <input
            id="call-up-date"
            type="date"
            value={form.scheduledAt}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, scheduledAt: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="call-up-contact" className="text-sm font-medium">
            Contact
          </label>
          <select
            id="call-up-contact"
            value={form.contactId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, contactId: event.target.value }))
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-black"
          >
            <option value="">No linked contact</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.fullName}
                {contact.companyName ? ` - ${contact.companyName}` : ""}
                {contact.jobTitle ? ` (${contact.jobTitle})` : ""}
              </option>
            ))}
          </select>
          {contacts.length === 0 ? (
            <p className="text-xs text-gray-500">
              Attach a contact to this application if you want to link the call-up
              to a person.
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isCreating}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCreating ? "Saving..." : "Add call-up"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      ) : null}
    </section>
  );
}
