"use client";

import { useMemo, useState } from "react";
import {
  interviewOutcomeValues,
  interviewTypeValues,
} from "@/lib/validations/interview";

type InterviewItem = {
  id: string;
  applicationId: string;
  type: string;
  stageName: string;
  scheduledAt: string | Date | null;
  durationMinutes: number | null;
  interviewerName: string | null;
  interviewerRole: string | null;
  locationOrLink: string | null;
  outcome: string | null;
  notes: string | null;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

type InterviewFormValues = {
  type: string;
  stageName: string;
  scheduledAt: string;
  durationMinutes: string;
  interviewerName: string;
  interviewerRole: string;
  locationOrLink: string;
  outcome: string;
  notes: string;
};

type ApplicationInterviewsProps = {
  applicationId: string;
  initialInterviews: InterviewItem[];
};

const emptyForm: InterviewFormValues = {
  type: "",
  stageName: "",
  scheduledAt: "",
  durationMinutes: "",
  interviewerName: "",
  interviewerRole: "",
  locationOrLink: "",
  outcome: "",
  notes: "",
};

function toLocalDateTimeInput(value: string | Date | null | undefined) {
  if (!value) return "";

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function formatDateTime(value: string | Date | null | undefined) {
  if (!value) return "Not scheduled";

  const date = typeof value === "string" ? new Date(value) : value;

  if (Number.isNaN(date.getTime())) return "Invalid date";

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function normalizeInterviewForState(data: any): InterviewItem {
  return {
    id: data.id,
    applicationId: data.applicationId,
    type: data.type ?? "",
    stageName: data.stageName ?? "",
    scheduledAt: data.scheduledAt ?? null,
    durationMinutes:
      data.durationMinutes === null || data.durationMinutes === undefined
        ? null
        : Number(data.durationMinutes),
    interviewerName: data.interviewerName ?? null,
    interviewerRole: data.interviewerRole ?? null,
    locationOrLink: data.locationOrLink ?? null,
    outcome: data.outcome ?? null,
    notes: data.notes ?? null,
    createdAt: data.createdAt ?? undefined,
    updatedAt: data.updatedAt ?? undefined,
  };
}

function buildFormFromInterview(interview: InterviewItem): InterviewFormValues {
  return {
    type: interview.type ?? "",
    stageName: interview.stageName ?? "",
    scheduledAt: toLocalDateTimeInput(interview.scheduledAt),
    durationMinutes:
      interview.durationMinutes === null ||
      interview.durationMinutes === undefined
        ? ""
        : String(interview.durationMinutes),
    interviewerName: interview.interviewerName ?? "",
    interviewerRole: interview.interviewerRole ?? "",
    locationOrLink: interview.locationOrLink ?? "",
    outcome: interview.outcome ?? "",
    notes: interview.notes ?? "",
  };
}

function buildPayload(values: InterviewFormValues) {
  const payload: Record<string, unknown> = {
    type: values.type,
    stageName: values.stageName.trim(),
  };

  if (values.scheduledAt) {
    payload.scheduledAt = new Date(values.scheduledAt).toISOString();
  }

  if (values.durationMinutes) {
    payload.durationMinutes = Number(values.durationMinutes);
  }

  if (values.interviewerName.trim()) {
    payload.interviewerName = values.interviewerName.trim();
  }

  if (values.interviewerRole.trim()) {
    payload.interviewerRole = values.interviewerRole.trim();
  }

  if (values.locationOrLink.trim()) {
    payload.locationOrLink = values.locationOrLink.trim();
  }

  if (values.outcome) {
    payload.outcome = values.outcome;
  }

  if (values.notes.trim()) {
    payload.notes = values.notes.trim();
  }

  return payload;
}

export function ApplicationInterviews({
  applicationId,
  initialInterviews,
}: ApplicationInterviewsProps) {
  const [interviews, setInterviews] = useState<InterviewItem[]>(
    [...initialInterviews].sort((a, b) => {
      const aTime = a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.scheduledAt
        ? new Date(b.scheduledAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    }),
  );

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createValues, setCreateValues] =
    useState<InterviewFormValues>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<InterviewFormValues>(emptyForm);

  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedInterviews = useMemo(() => {
    return [...interviews].sort((a, b) => {
      const aTime = a.scheduledAt
        ? new Date(a.scheduledAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.scheduledAt
        ? new Date(b.scheduledAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      return aTime - bTime;
    });
  }, [interviews]);

  function handleCreateChange<K extends keyof InterviewFormValues>(
    field: K,
    value: InterviewFormValues[K],
  ) {
    setCreateValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleEditChange<K extends keyof InterviewFormValues>(
    field: K,
    value: InterviewFormValues[K],
  ) {
    setEditValues((prev) => ({ ...prev, [field]: value }));
  }

  function startEditing(interview: InterviewItem) {
    setError(null);
    setEditingId(interview.id);
    setEditValues(buildFormFromInterview(interview));
  }

  function cancelEditing() {
    setEditingId(null);
    setEditValues(emptyForm);
  }

  async function handleCreateInterview(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmittingCreate(true);

    try {
      const response = await fetch(
        `/api/applications/${applicationId}/interviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(buildPayload(createValues)),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create interview.");
      }

      const createdInterview = normalizeInterviewForState(data);
      setInterviews((prev) => [createdInterview, ...prev]);
      setCreateValues(emptyForm);
      setIsCreateOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create interview.",
      );
    } finally {
      setIsSubmittingCreate(false);
    }
  }

  async function handleUpdateInterview(
    e: React.FormEvent<HTMLFormElement>,
    interviewId: string,
  ) {
    e.preventDefault();
    setError(null);
    setIsSubmittingEdit(true);

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildPayload(editValues)),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Failed to update interview.");
      }

      const updatedInterview = normalizeInterviewForState(data);

      setInterviews((prev) =>
        prev.map((item) => (item.id === interviewId ? updatedInterview : item)),
      );

      setEditingId(null);
      setEditValues(emptyForm);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update interview.",
      );
    } finally {
      setIsSubmittingEdit(false);
    }
  }

  async function handleDeleteInterview(interviewId: string) {
    const confirmed = window.confirm("Delete this interview?");
    if (!confirmed) return;

    setError(null);
    setDeletingId(interviewId);

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete interview.");
      }

      setInterviews((prev) => prev.filter((item) => item.id !== interviewId));

      if (editingId === interviewId) {
        cancelEditing();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete interview.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Interviews</h2>
          <p className="mt-1 text-sm text-gray-600">
            Track scheduled calls, stages, outcomes, and notes for this
            application.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setIsCreateOpen((prev) => !prev);
          }}
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          {isCreateOpen ? "Close" : "Add interview"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isCreateOpen ? (
        <form
          onSubmit={handleCreateInterview}
          className="mt-5 space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="create-type"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Type <span className="text-red-500">*</span>
              </label>
              <select
                id="create-type"
                value={createValues.type}
                onChange={(e) => handleCreateChange("type", e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-gray-900"
              >
                <option value="" disabled>
                  Choose an interview type
                </option>
                {interviewTypeValues.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="create-stageName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Stage name <span className="text-red-500">*</span>
              </label>
              <input
                id="create-stageName"
                type="text"
                value={createValues.stageName}
                onChange={(e) =>
                  handleCreateChange("stageName", e.target.value)
                }
                required
                placeholder="e.g. Technical interview"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-scheduledAt"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Scheduled at
              </label>
              <input
                id="create-scheduledAt"
                type="datetime-local"
                value={createValues.scheduledAt}
                onChange={(e) =>
                  handleCreateChange("scheduledAt", e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-durationMinutes"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Duration (minutes)
              </label>
              <input
                id="create-durationMinutes"
                type="number"
                min="1"
                value={createValues.durationMinutes}
                onChange={(e) =>
                  handleCreateChange("durationMinutes", e.target.value)
                }
                placeholder="e.g. 45"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-interviewerName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Interviewer name
              </label>
              <input
                id="create-interviewerName"
                type="text"
                value={createValues.interviewerName}
                onChange={(e) =>
                  handleCreateChange("interviewerName", e.target.value)
                }
                placeholder="e.g. Sarah Johnson"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-interviewerRole"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Interviewer role
              </label>
              <input
                id="create-interviewerRole"
                type="text"
                value={createValues.interviewerRole}
                onChange={(e) =>
                  handleCreateChange("interviewerRole", e.target.value)
                }
                placeholder="e.g. Engineering Manager"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="create-locationOrLink"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Location or link
              </label>
              <input
                id="create-locationOrLink"
                type="text"
                value={createValues.locationOrLink}
                onChange={(e) =>
                  handleCreateChange("locationOrLink", e.target.value)
                }
                placeholder="e.g. Google Meet / Lisbon office"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="create-outcome"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Outcome
              </label>
              <select
                id="create-outcome"
                value={createValues.outcome}
                onChange={(e) => handleCreateChange("outcome", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none ring-0 transition focus:border-gray-900"
              >
                <option value="">No outcome yet</option>
                {interviewOutcomeValues.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label
              htmlFor="create-notes"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Notes
            </label>
            <textarea
              id="create-notes"
              value={createValues.notes}
              onChange={(e) => handleCreateChange("notes", e.target.value)}
              rows={4}
              placeholder="Add prep notes, feedback, or next steps..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSubmittingCreate}
              className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingCreate ? "Saving..." : "Save interview"}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setCreateValues(emptyForm);
              }}
              className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {sortedInterviews.length === 0 ? (
        <p className="mt-5 text-sm text-gray-600">
          No interviews added yet for this application.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {sortedInterviews.map((interview) => {
            const isEditing = editingId === interview.id;

            return (
              <div
                key={interview.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                {isEditing ? (
                  <form
                    onSubmit={(e) => handleUpdateInterview(e, interview.id)}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor={`edit-type-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id={`edit-type-${interview.id}`}
                          value={editValues.type}
                          onChange={(e) =>
                            handleEditChange("type", e.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        >
                          <option value="" disabled>
                            Choose an interview type
                          </option>
                          {interviewTypeValues.map((type) => (
                            <option key={type} value={type}>
                              {type}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-stageName-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Stage name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id={`edit-stageName-${interview.id}`}
                          type="text"
                          value={editValues.stageName}
                          onChange={(e) =>
                            handleEditChange("stageName", e.target.value)
                          }
                          required
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-scheduledAt-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Scheduled at
                        </label>
                        <input
                          id={`edit-scheduledAt-${interview.id}`}
                          type="datetime-local"
                          value={editValues.scheduledAt}
                          onChange={(e) =>
                            handleEditChange("scheduledAt", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-durationMinutes-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Duration (minutes)
                        </label>
                        <input
                          id={`edit-durationMinutes-${interview.id}`}
                          type="number"
                          min="1"
                          value={editValues.durationMinutes}
                          onChange={(e) =>
                            handleEditChange("durationMinutes", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-interviewerName-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Interviewer name
                        </label>
                        <input
                          id={`edit-interviewerName-${interview.id}`}
                          type="text"
                          value={editValues.interviewerName}
                          onChange={(e) =>
                            handleEditChange("interviewerName", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-interviewerRole-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Interviewer role
                        </label>
                        <input
                          id={`edit-interviewerRole-${interview.id}`}
                          type="text"
                          value={editValues.interviewerRole}
                          onChange={(e) =>
                            handleEditChange("interviewerRole", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          htmlFor={`edit-locationOrLink-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Location or link
                        </label>
                        <input
                          id={`edit-locationOrLink-${interview.id}`}
                          type="text"
                          value={editValues.locationOrLink}
                          onChange={(e) =>
                            handleEditChange("locationOrLink", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`edit-outcome-${interview.id}`}
                          className="mb-1 block text-sm font-medium text-gray-700"
                        >
                          Outcome
                        </label>
                        <select
                          id={`edit-outcome-${interview.id}`}
                          value={editValues.outcome}
                          onChange={(e) =>
                            handleEditChange("outcome", e.target.value)
                          }
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                        >
                          <option value="">No outcome yet</option>
                          {interviewOutcomeValues.map((outcome) => (
                            <option key={outcome} value={outcome}>
                              {outcome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor={`edit-notes-${interview.id}`}
                        className="mb-1 block text-sm font-medium text-gray-700"
                      >
                        Notes
                      </label>
                      <textarea
                        id={`edit-notes-${interview.id}`}
                        value={editValues.notes}
                        onChange={(e) =>
                          handleEditChange("notes", e.target.value)
                        }
                        rows={4}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition focus:border-gray-900"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="submit"
                        disabled={isSubmittingEdit}
                        className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isSubmittingEdit ? "Saving..." : "Save changes"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900">
                            {interview.stageName}
                          </h3>
                          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                            {interview.type}
                          </span>
                          {interview.outcome ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                              {interview.outcome}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm text-gray-600">
                          {formatDateTime(interview.scheduledAt)}
                          {interview.durationMinutes
                            ? ` • ${interview.durationMinutes} min`
                            : ""}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(interview)}
                          className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteInterview(interview.id)}
                          disabled={deletingId === interview.id}
                          className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === interview.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Interviewer
                        </p>
                        <p className="mt-1 text-sm text-gray-800">
                          {interview.interviewerName || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Role
                        </p>
                        <p className="mt-1 text-sm text-gray-800">
                          {interview.interviewerRole || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3 md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Location / link
                        </p>
                        <p className="mt-1 break-words text-sm text-gray-800">
                          {interview.locationOrLink || "—"}
                        </p>
                      </div>

                      <div className="rounded-lg bg-white p-3 md:col-span-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                          Notes
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">
                          {interview.notes || "—"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
