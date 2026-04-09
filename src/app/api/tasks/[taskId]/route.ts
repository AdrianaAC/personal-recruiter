import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function PATCH(_: Request, context: RouteContext) {
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
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: task.completed
      ? {
          completed: false,
          archivedAt: null,
        }
      : {
          completed: true,
          archivedAt: new Date(),
        },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");

  if (updated.applicationId) {
    revalidatePath(`/dashboard/applications/${updated.applicationId}`);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: {
        id: taskId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/tasks/[taskId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
