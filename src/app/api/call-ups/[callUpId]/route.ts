import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    callUpId: string;
  }>;
};

export async function PATCH(_: Request, context: RouteContext) {
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
    });

    if (!callUp) {
      return NextResponse.json({ error: "Call-up not found" }, { status: 404 });
    }

    const updated = await prisma.callUp.update({
      where: { id: callUpId },
      data: callUp.archivedAt
        ? {
            archivedAt: null,
            status: "PLANNED",
          }
        : {
            archivedAt: new Date(),
            status: "DONE",
        },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/call-ups");

    if (updated.applicationId) {
      revalidatePath(`/dashboard/applications/${updated.applicationId}`);
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/call-ups/[callUpId] error:", error);

    return NextResponse.json(
      { error: "Failed to update call-up" },
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

    const { callUpId } = await context.params;

    const existingCallUp = await prisma.callUp.findFirst({
      where: {
        id: callUpId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingCallUp) {
      return NextResponse.json({ error: "Call-up not found" }, { status: 404 });
    }

    await prisma.callUp.delete({
      where: {
        id: callUpId,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/call-ups/[callUpId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete call-up" },
      { status: 500 },
    );
  }
}
