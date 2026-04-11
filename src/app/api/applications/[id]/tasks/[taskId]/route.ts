import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncApplicationWorkflowTask } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";
import { createTaskSchema } from "@/lib/validations/task";

type RouteContext = {
  params: Promise<{
    taskId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskId } = await context.params;

    const existingTask = await prisma.task.findFirst({
      where: {
        id: taskId,
        application: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        applicationId: true,
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const data = parsed.data;

    const updatedTask = await prisma.$transaction(async (tx) => {
      const nextTask = await tx.task.update({
        where: {
          id: taskId,
        },
        data: {
          title: data.title,
          description: data.description || null,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          snoozedUntil: data.snoozedUntil ? new Date(data.snoozedUntil) : null,
          ...(typeof data.completed === "boolean"
            ? {
                completed: data.completed,
                archivedAt: data.completed ? new Date() : null,
              }
            : {}),
        },
        select: {
          id: true,
          origin: true,
          snoozedUntil: true,
          title: true,
          description: true,
          dueDate: true,
          completed: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (existingTask.applicationId) {
        await syncApplicationWorkflowTask(tx, existingTask.applicationId);
      }

      return nextTask;
    });

    return NextResponse.json(updatedTask, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/applications/[id]/tasks/[taskId] error:", error);

    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
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
        application: {
          userId: session.user.id,
        },
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
    console.error("DELETE /api/applications/[id]/tasks/[taskId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 },
    );
  }
}
