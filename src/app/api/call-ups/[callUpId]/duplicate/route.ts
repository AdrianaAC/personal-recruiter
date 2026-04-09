import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    callUpId: string;
  }>;
};

function revalidateCallUpPaths(applicationId?: string | null) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard/call-ups");

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

    const { callUpId } = await context.params;

    const callUp = await prisma.callUp.findFirst({
      where: {
        id: callUpId,
        userId: session.user.id,
      },
      select: {
        title: true,
        description: true,
        notes: true,
        scheduledAt: true,
        applicationId: true,
        contactId: true,
      },
    });

    if (!callUp) {
      return NextResponse.json({ error: "Call-up not found" }, { status: 404 });
    }

    const duplicatedCallUp = await prisma.callUp.create({
      data: {
        userId: session.user.id,
        applicationId: callUp.applicationId,
        contactId: callUp.contactId,
        title: callUp.title,
        description: callUp.description,
        notes: callUp.notes,
        scheduledAt: callUp.scheduledAt,
      },
      select: {
        id: true,
        title: true,
        description: true,
        notes: true,
        scheduledAt: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
        contact: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            jobTitle: true,
          },
        },
      },
    });

    revalidateCallUpPaths(callUp.applicationId);

    return NextResponse.json(duplicatedCallUp, { status: 201 });
  } catch (error) {
    console.error("POST /api/call-ups/[callUpId]/duplicate error:", error);

    return NextResponse.json(
      { error: "Failed to duplicate call-up" },
      { status: 500 },
    );
  }
}
