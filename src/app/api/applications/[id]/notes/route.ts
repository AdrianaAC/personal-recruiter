import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { syncApplicationWorkflowTask } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";
import { createNoteSchema } from "@/lib/validations/note";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function revalidateApplicationPaths(id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/tasks/archive");
  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${id}`);
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await context.params;

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const notes = await prisma.note.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        content: true,
        assessmentDueDate: true,
        assessmentSubmittedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(notes, { status: 200 });
  } catch (error) {
    console.error("GET /api/applications/[id]/notes error:", error);

    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: applicationId } = await context.params;

    const application = await prisma.jobApplication.findFirst({
      where: {
        id: applicationId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = createNoteSchema.safeParse(body);

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

    const note = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.note.create({
        data: {
          applicationId,
          title: data.title || null,
          content: data.content,
          assessmentDueDate: data.assessmentDueDate
            ? new Date(data.assessmentDueDate)
            : null,
          assessmentSubmittedAt: data.assessmentSubmitted ? new Date() : null,
        },
        select: {
          id: true,
          title: true,
          content: true,
          assessmentDueDate: true,
          assessmentSubmittedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await syncApplicationWorkflowTask(tx, applicationId);

      return createdNote;
    });

    revalidateApplicationPaths(applicationId);

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications/[id]/notes error:", error);

    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}
