import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "@/components/applications/applications-list";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      companyName: true,
      roleTitle: true,
      location: true,
      workMode: true,
      status: true,
      priority: true,
      jobUrl: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="text-sm text-gray-600">
            Track your job opportunities in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Dashboard
          </Link>

          <Link
            href="/dashboard/applications/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            New application
          </Link>
        </div>
      </div>

      <ApplicationsList
        initialApplications={applications}
        emptyTitle="No applications yet"
        emptyDescription="Start by saving your first opportunity."
        emptyActionHref="/dashboard/applications/new"
        emptyActionLabel="Create first application"
        showSupplementalTags
        showJobPostAction
      />
    </div>
  );
}
