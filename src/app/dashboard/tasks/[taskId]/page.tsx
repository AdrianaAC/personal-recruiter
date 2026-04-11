import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TaskDetailView } from "@/components/dashboard/task-detail-view";

type TaskDetailPageProps = {
  params: Promise<{
    taskId: string;
  }>;
};

export default async function TaskDetailPage({
  params,
}: TaskDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { taskId } = await params;

  const [task, applications] = await Promise.all([
    prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
            status: true,
          },
        },
      },
    }),
    prisma.jobApplication.findMany({
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
        status: true,
      },
    }),
  ]);

  if (!task) {
    notFound();
  }

  return <TaskDetailView initialTask={task} applications={applications} />;
}
