import { auth, signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back{session?.user?.name ? `, ${session.user.name}` : ""}.
            </p>
          </div>

          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border px-4 py-2 text-sm font-medium"
            >
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Your private workspace</h2>
          <p className="mt-2 text-sm text-gray-600">
            This dashboard is protected and tied to the authenticated user.
          </p>
        </div>
      </div>
    </main>
  );
}