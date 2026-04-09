import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const application = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        companyName: true,
        roleTitle: true,
        location: true,
        workMode: true,
        salaryMin: true,
        salaryMax: true,
        currency: true,
        source: true,
        jobUrl: true,
        jobDescription: true,
        status: true,
        priority: true,
        appliedAt: true,
        nextStep: true,
        notesSummary: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const duplicatedApplication = await prisma.jobApplication.create({
      data: {
        userId: session.user.id,
        companyName: application.companyName,
        roleTitle: application.roleTitle,
        location: application.location,
        workMode: application.workMode,
        salaryMin: application.salaryMin,
        salaryMax: application.salaryMax,
        currency: application.currency,
        source: application.source,
        jobUrl: application.jobUrl,
        jobDescription: application.jobDescription,
        status: application.status,
        priority: application.priority,
        appliedAt: application.appliedAt,
        nextStep: application.nextStep,
        notesSummary: application.notesSummary,
      },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return NextResponse.json(duplicatedApplication, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications/[id]/duplicate error:", error);

    return NextResponse.json(
      { error: "Failed to duplicate application" },
      { status: 500 },
    );
  }
}
