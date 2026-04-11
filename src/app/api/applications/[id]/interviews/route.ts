import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { syncApplicationWorkflowTask } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";
import { createInterviewSchema } from "@/lib/validations/interview";

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

    const interviews = await prisma.interview.findMany({
      where: {
        applicationId,
      },
      orderBy: [
        { scheduledAt: "asc" },
        { createdAt: "desc" },
      ],
      select: {
        id: true,
        type: true,
        stageName: true,
        scheduledAt: true,
        durationMinutes: true,
        interviewerName: true,
        interviewerRole: true,
        locationOrLink: true,
        outcome: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(interviews, { status: 200 });
  } catch (error) {
    console.error("GET /api/applications/[id]/interviews error:", error);

    return NextResponse.json(
      { error: "Failed to fetch interviews" },
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
    const parsed = createInterviewSchema.safeParse(body);

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

    const interview = await prisma.$transaction(async (tx) => {
      const createdInterview = await tx.interview.create({
        data: {
          applicationId,
          type: data.type,
          stageName: data.stageName || null,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          durationMinutes: data.durationMinutes ?? null,
          interviewerName: data.interviewerName || null,
          interviewerRole: data.interviewerRole || null,
          locationOrLink: data.locationOrLink || null,
          outcome: data.outcome ?? null,
          notes: data.notes || null,
        },
        select: {
          id: true,
          type: true,
          stageName: true,
          scheduledAt: true,
          durationMinutes: true,
          interviewerName: true,
          interviewerRole: true,
          locationOrLink: true,
          outcome: true,
          notes: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await syncApplicationWorkflowTask(tx, applicationId);

      return createdInterview;
    });

    revalidateApplicationPaths(applicationId);

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications/[id]/interviews error:", error);

    return NextResponse.json(
      { error: "Failed to create interview" },
      { status: 500 },
    );
  }
}
