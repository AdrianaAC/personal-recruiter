import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentApplicationsSection } from "@/components/dashboard/recent-applications-section";
import { RecentTasksSection } from "@/components/dashboard/recent-tasks-section";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";

export default async function ArchivePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [applications, tasks, followUps] = await Promise.all([
    prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
        archivedAt: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: "desc",
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
        nextStep: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.task.findMany({
      where: {
        userId: session.user.id,
        archivedAt: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.callUp.findMany({
      where: {
        userId: session.user.id,
        archivedAt: {
          not: null,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        title: true,
        description: true,
        notes: true,
        scheduledAt: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
  ]);

  const rejectedApplicationsCount = applications.filter(
    (application) => application.status === "REJECTED",
  ).length;
  const withdrawnApplicationsCount = applications.filter(
    (application) => application.status === "WITHDRAWN",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Archive
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Applications, tasks, and FollowUps you have stored for reference.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-slate-950 bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Back to dashboard
          </Link>

          <Link
            href="/dashboard/tasks"
            className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          >
            Tasks
          </Link>

          <Link
            href="/dashboard/applications"
            className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100"
          >
            Applications
          </Link>

          <Link
            href="/dashboard/call-ups"
            className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
          >
            FollowUps
          </Link>
        </div>
      </div>

      <RecentApplicationsSection
        applications={applications}
        title="Applications"
        description=""
        viewHref={null}
        summaryChips={[
          { value: applications.length, label: "archived" },
          { value: rejectedApplicationsCount, label: "rejected" },
          { value: withdrawnApplicationsCount, label: "withdrawn" },
        ]}
        emptyTitle="No archived applications"
        emptyDescription="Applications you archive will show up here."
        emptyActionHref="/dashboard/applications"
        emptyActionLabel="Back to applications"
        showEditAction={false}
        showArchiveAction={false}
        showCopyAction={false}
        dateTagMode="updated"
      />

      <RecentTasksSection
        tasks={tasks}
        title="Tasks"
        description=""
        viewHref={null}
        countLabel="archived"
        emptyTitle="No archived tasks"
        emptyDescription="Completed tasks will appear here."
        itemActionMode="delete"
      />

      <RecentCallUpsSection
        callUps={followUps}
        title="FollowUps"
        description=""
        viewHref={null}
        countLabel="archived"
        secondaryCountLabel="linked"
        tertiaryCountLabel="standalone"
        emptyTitle="No archived FollowUps"
        emptyDescription="Completed FollowUps will appear here."
        itemActionMode="delete"
      />
    </div>
  );
}
