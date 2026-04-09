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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Tasks</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            All Open Tasks
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Everything that still needs FollowUp.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Back to dashboard
        </Link>
      </div>

      <RecentTasksSection
        tasks={tasks}
        title="Tasks"
        description="Everything that still needs FollowUp."
        viewHref={null}
      />
    </div>
  );
}
