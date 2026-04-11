"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  applicationStatusValues,
  priorityValues,
  workModeValues,
} from "@/lib/validations/application";

type FormState = {
  companyName: string;
  roleTitle: string;
  location: string;
  workMode: "" | "REMOTE" | "HYBRID" | "ONSITE";
  contactName: string;
  jobUrl: string;
  jobDescription: string;
  applicationNotes: string;
  offerExpiresAt: string;
  status:
    | "SAVED"
    | "APPLIED"
    | "SCREENING"
    | "TECHNICAL_INTERVIEW"
    | "TAKE_HOME"
    | "FINAL_INTERVIEW"
    | "OFFER"
    | "REJECTED"
    | "WITHDRAWN";
  priority: "LOW" | "MEDIUM" | "HIGH";
};

const initialState: FormState = {
  companyName: "",
  roleTitle: "",
  location: "",
  workMode: "",
  contactName: "",
  jobUrl: "",
  jobDescription: "",
  applicationNotes: "",
  offerExpiresAt: "",
  status: "SAVED",
  priority: "MEDIUM",
};

export function ApplicationForm() {
  const router = useRouter();

  const [form, setForm] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyName: form.companyName,
          roleTitle: form.roleTitle,
          location: form.location,
          workMode: form.workMode || null,
          contactName: form.contactName,
          jobUrl: form.jobUrl,
          jobDescription: form.jobDescription,
          applicationNotes: form.applicationNotes,
          offerExpiresAt: form.offerExpiresAt,
          status: form.status,
          priority: form.priority,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result?.error || "Something went wrong.");
        return;
      }

      router.push("/dashboard/applications");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving the application.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="companyName" className="text-sm font-medium">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="e.g. Kraken"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="roleTitle" className="text-sm font-medium">
            Role Title *
          </label>
          <input
            id="roleTitle"
            type="text"
            value={form.roleTitle}
            onChange={(e) => updateField("roleTitle", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="e.g. Frontend Engineer"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="location" className="text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={form.location}
            onChange={(e) => updateField("location", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="e.g. Lisbon / Remote"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="workMode" className="text-sm font-medium">
            Work Mode
          </label>
          <select
            id="workMode"
            value={form.workMode}
            onChange={(e) =>
              updateField("workMode", e.target.value as FormState["workMode"])
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          >
            <option value="">Select work mode</option>
            {workModeValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="contactName" className="text-sm font-medium">
            Primary Contact
          </label>
          <input
            id="contactName"
            type="text"
            value={form.contactName}
            onChange={(e) => updateField("contactName", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="e.g. Jane Doe"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="jobUrl" className="text-sm font-medium">
            Job URL
          </label>
          <input
            id="jobUrl"
            type="url"
            value={form.jobUrl}
            onChange={(e) => updateField("jobUrl", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="https://..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            value={form.status}
            onChange={(e) =>
              updateField("status", e.target.value as FormState["status"])
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          >
            {applicationStatusValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="offerExpiresAt" className="text-sm font-medium">
            Offer expiration
          </label>
          <input
            id="offerExpiresAt"
            type="date"
            value={form.offerExpiresAt}
            onChange={(e) => updateField("offerExpiresAt", e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="text-sm font-medium">
            Priority
          </label>
          <select
            id="priority"
            value={form.priority}
            onChange={(e) =>
              updateField("priority", e.target.value as FormState["priority"])
            }
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
          >
            {priorityValues.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="jobDescription" className="text-sm font-medium">
            Job Description
          </label>
          <textarea
            id="jobDescription"
            value={form.jobDescription}
            onChange={(e) => updateField("jobDescription", e.target.value)}
            className="min-h-[180px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="Paste the job description here..."
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="applicationNotes" className="text-sm font-medium">
            Application Notes
          </label>
          <textarea
            id="applicationNotes"
            value={form.applicationNotes}
            onChange={(e) => updateField("applicationNotes", e.target.value)}
            className="min-h-[160px] w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-black"
            placeholder="Capture recruiter context, interview prep, FollowUps, or anything else you want to build on later..."
          />
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save application"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/dashboard/applications")}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
