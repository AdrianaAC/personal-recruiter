import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentTasksSection } from "@/components/dashboard/recent-tasks-section";

export default async function TasksPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const tasks = await prisma.task.findMany({
    where: {
      userId: session.user.id,
      completed: false,
      archivedAt: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      isSpecificDate: true,
      updatedAt: true,
      application: {
        select: {
          id: true,
          companyName: true,
          roleTitle: true,
        },
      },
    },
  });

  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
      archivedAt: null,
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      companyName: true,
      roleTitle: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Everything that still needs to be done
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </Link>

          <Link
            href="/dashboard/archive"
            className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 transition hover:bg-amber-100"
          >
            Archive
          </Link>
        </div>
      </div>

      <RecentTasksSection
        tasks={tasks}
        title="Tasks"
        description=""
        viewHref={null}
        showAddTaskAction
        largeAddTaskAction
        enableTaskEditing
        showDeleteAction
        showCopyAction
        addTaskApplications={applications}
      />
    </div>
  );
}
