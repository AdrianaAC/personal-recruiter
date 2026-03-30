import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-xl rounded-2xl border p-8 shadow-sm">
        <h1 className="text-3xl font-bold">Personal Recruiter</h1>
        <p className="mt-3 text-sm text-gray-600">
          Track applications, interviews, notes, and prep in one place.
        </p>

        <div className="mt-6 flex gap-3">
          <Link
            href="/register"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
