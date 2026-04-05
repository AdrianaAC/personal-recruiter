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

    await prisma.jobApplication.update({
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

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/applications/[id]/archive error:", error);

    return NextResponse.json(
      { error: "Failed to archive application" },
      { status: 500 },
    );
  }
}
