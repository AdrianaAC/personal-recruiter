import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { syncApplicationWorkflowTask } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function revalidateApplicationPaths(id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/applications/archive");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/tasks/archive");
  revalidatePath(`/dashboard/applications/${id}`);
  revalidatePath(`/dashboard/applications/${id}/edit`);
}

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        archivedAt: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    if (existingApplication.archivedAt) {
      return NextResponse.json(
        { error: "Application is already archived" },
        { status: 409 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.jobApplication.update({
        where: {
          id,
        },
        data: {
          archivedAt: new Date(),
        },
        select: {
          id: true,
        },
      });

      await syncApplicationWorkflowTask(tx, id);
    });

    revalidateApplicationPaths(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/applications/[id]/archive error:", error);

    return NextResponse.json(
      { error: "Failed to archive application" },
      { status: 500 },
    );
  }
}
