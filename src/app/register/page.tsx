"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      router.push("/login");
    } catch {
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border p-8 shadow-sm"
      >
        <h1 className="text-2xl font-bold">Create account</h1>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="Username"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border px-3 py-2"
              placeholder="••••••••"
              required
            />
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
    </main>
  );
}