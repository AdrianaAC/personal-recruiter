"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function DashboardContactQuickAdd({ open, onClose }: Props) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fullName,
        email: email || undefined,
        linkedinUrl: linkedinUrl || undefined,
        companyName: companyName || undefined,
        jobTitle: jobTitle || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const text = await res.text();
      console.error(text);
      alert("Failed to create contact.");
      return;
    }

    setFullName("");
    setEmail("");
    setLinkedinUrl("");
    setCompanyName("");
    setJobTitle("");
    onClose();
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-xl border border-rose-300 bg-white p-5 shadow-lg">
        <h2 className="text-lg font-semibold text-slate-950">New Contact</h2>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full rounded-md border border-rose-300 bg-rose-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-rose-50"
            required
          />

          <input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-rose-300 bg-rose-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-rose-50"
          />

          <input
            placeholder="LinkedIn URL (optional)"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full rounded-md border border-rose-300 bg-rose-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-rose-50"
          />

          <input
            placeholder="Company (optional)"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full rounded-md border border-rose-300 bg-rose-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-rose-50"
          />

          <input
            placeholder="Job title (optional)"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="w-full rounded-md border border-rose-300 bg-rose-50/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-rose-500 focus:bg-rose-50"
          />

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-950 transition hover:bg-rose-100"
            >
              Cancel
            </button>

            <button
              disabled={loading}
              className="rounded-md bg-rose-500 px-4 py-2 text-sm text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Saving..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
