import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createInterviewSchema } from "@/lib/validations/interview";

type RouteContext = {
  params: Promise<{
    interviewId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { interviewId } = await context.params;

    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingInterview) {
      return NextResponse.json(
        { error: "Interview not found" },
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

    const updatedInterview = await prisma.interview.update({
      where: {
        id: interviewId,
      },
      data: {
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

    return NextResponse.json(updatedInterview, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/interviews/[interviewId] error:", error);

    return NextResponse.json(
      { error: "Failed to update interview" },
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

    const { interviewId } = await context.params;

    const existingInterview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        application: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingInterview) {
      return NextResponse.json(
        { error: "Interview not found" },
        { status: 404 },
      );
    }

    await prisma.interview.delete({
      where: {
        id: interviewId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/interviews/[interviewId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete interview" },
      { status: 500 },
    );
  }
}