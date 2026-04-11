"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { interviewTypeValues } from "@/lib/validations/interview";

type ApplicationOption = {
  id: string;
  companyName: string;
  roleTitle: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  applications: ApplicationOption[];
  initialScheduledAt?: string | null;
};

const DEFAULT_DURATION_MINUTES = "45";

export function DashboardInterviewQuickAdd({
  open,
  onClose,
  applications,
  initialScheduledAt,
}: Props) {
  const router = useRouter();
  const [applicationId, setApplicationId] = useState("");
  const [type, setType] = useState<string>("RECRUITER");
  const [stageName, setStageName] = useState("");
  const [scheduledAt, setScheduledAt] = useState(initialScheduledAt ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    DEFAULT_DURATION_MINUTES,
  );
  const [interviewerName, setInterviewerName] = useState("");
  const [locationOrLink, setLocationOrLink] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!applicationId) {
      alert("Please choose an application.");
      return;
    }

    setLoading(true);

    const response = await fetch(`/api/applications/${applicationId}/interviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type,
        stageName,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        durationMinutes: durationMinutes ? Number(durationMinutes) : null,
        interviewerName,
        locationOrLink,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(errorText);
      alert("Failed to create interview.");
      return;
    }

    setApplicationId("");
    setType("RECRUITER");
    setStageName("");
    setScheduledAt(initialScheduledAt ?? "");
    setDurationMinutes(DEFAULT_DURATION_MINUTES);
    setInterviewerName("");
    setLocationOrLink("");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold">New Interview</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <select
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            <option value="">Choose an application</option>
            {applications.map((application) => (
              <option key={application.id} value={application.id}>
                {application.companyName} - {application.roleTitle}
              </option>
            ))}
          </select>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          >
            {interviewTypeValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>

          <input
            placeholder="Stage name"
            value={stageName}
            onChange={(event) => setStageName(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            required
          />

          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <input
            type="number"
            min="1"
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Duration in minutes"
          />

          <input
            placeholder="Interviewer name"
            value={interviewerName}
            onChange={(event) => setInterviewerName(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

          <input
            placeholder="Meeting link or location"
            value={locationOrLink}
            onChange={(event) => setLocationOrLink(event.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />

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
