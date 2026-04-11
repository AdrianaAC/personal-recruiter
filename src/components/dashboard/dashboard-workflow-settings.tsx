"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

type DashboardWorkflowSettingsProps = {
  thankYouReminderEnabled: boolean;
};

export function DashboardWorkflowSettings({
  thankYouReminderEnabled,
}: DashboardWorkflowSettingsProps) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(thankYouReminderEnabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle() {
    const nextEnabled = !enabled;

    setEnabled(nextEnabled);
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          autoThankYouReminderEnabled: nextEnabled,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        setEnabled(!nextEnabled);
        setError(
          result?.error || `Failed to update setting (${response.status}).`,
        );
        return;
      }

      setEnabled(Boolean(result?.autoThankYouReminderEnabled));
      startTransition(() => {
        router.refresh();
      });
    } catch (requestError) {
      console.error(requestError);
      setEnabled(!nextEnabled);
      setError("Something went wrong while updating workflow settings.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Workflow Settings
          </p>
          <h2 className="mt-2 text-sm font-semibold text-slate-950">
            Thank-you reminders
          </h2>
          <p className="mt-1 text-xs text-slate-600">
            Create a reminder after interviews to send a thank-you email or
            LinkedIn message within 24 hours.
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Toggle thank-you reminders"
          onClick={() => {
            void handleToggle();
          }}
          disabled={isSaving}
          className={`inline-flex h-8 min-w-[3.5rem] items-center rounded-full border px-1 transition disabled:cursor-not-allowed disabled:opacity-60 ${
            enabled
              ? "border-emerald-300 bg-emerald-100 justify-end"
              : "border-slate-300 bg-slate-200 justify-start"
          }`}
        >
          <span
            className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold ${
              enabled
                ? "bg-emerald-600 text-white"
                : "bg-white text-slate-500"
            }`}
          >
            {enabled ? "On" : "Off"}
          </span>
        </button>
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500">
        {enabled
          ? "Enabled for future and existing interview workflows."
          : "Disabled. Existing auto thank-you reminders will be removed."}
      </p>

      {error ? (
        <p className="mt-2 text-xs text-rose-600">{error}</p>
      ) : null}
    </div>
  );
}
