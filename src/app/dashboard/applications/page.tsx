import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getApplicationNextStepStatus } from "@/lib/application-next-step";
import { getApplicationStaleness } from "@/lib/application-staleness";
import { syncUserApplicationWorkflowTasks } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";
import { ApplicationsList } from "@/components/applications/applications-list";

export default async function ApplicationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  await syncUserApplicationWorkflowTasks(prisma, session.user.id);

  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
      archivedAt: null,
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
      updatedAt: true,
      interviews: {
        select: {
          outcome: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      tasks: {
        select: {
          completed: true,
          archivedAt: true,
        },
      },
      callUps: {
        select: {
          status: true,
          archivedAt: true,
        },
      },
      notes: {
        select: {
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  const applicationsWithStaleness = applications.map((application) => {
    const { interviews, notes, tasks, callUps, ...applicationSummary } = application;
    const staleness = getApplicationStaleness({
      ...applicationSummary,
      interviews,
      notes,
    });
    const nextStepStatus = getApplicationNextStepStatus({
      ...applicationSummary,
      interviews,
      tasks,
      callUps,
    });

    return {
      ...applicationSummary,
      staleLevel: staleness?.level ?? null,
      staleLabel: staleness?.label ?? null,
      staleDescription: staleness?.description ?? null,
      staleWeeks: staleness?.weeksSinceActivity ?? null,
      missingNextStepDetected: nextStepStatus.isMissingNextStep,
      missingNextStepMessage: nextStepStatus.message,
    };
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
            href="/dashboard/archive"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Archive
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
        initialApplications={applicationsWithStaleness}
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
