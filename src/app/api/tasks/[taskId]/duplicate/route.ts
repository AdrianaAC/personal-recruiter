import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

function revalidateTaskPaths(applicationId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/tasks/archive");

  if (applicationId) {
    revalidatePath(`/dashboard/applications/${applicationId}`);
  }
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      select: {
        title: true,
        description: true,
        dueDate: true,
        applicationId: true,
        origin: true,
        snoozedUntil: true,
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const duplicatedTask = await prisma.task.create({
      data: {
        userId: session.user.id,
        applicationId: task.applicationId,
        origin: "manual",
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
      },
      select: {
        id: true,
        origin: true,
        snoozedUntil: true,
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

    revalidateTaskPaths(task.applicationId);

    return NextResponse.json(duplicatedTask, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks/[taskId]/duplicate error:", error);

    return NextResponse.json(
      { error: "Failed to duplicate task" },
      { status: 500 },
    );
  }
}
