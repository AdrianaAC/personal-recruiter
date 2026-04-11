import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCallUpSchema } from "@/lib/validations/call-up";

type RouteContext = {
  params: Promise<{
    callUpId: string;
  }>;
};

async function readJsonSafely(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function revalidateCallUpPaths(
  callUpId?: string | null,
  ...applicationIds: Array<string | null | undefined>
) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard/call-ups");

  if (callUpId) {
    revalidatePath(`/dashboard/call-ups/${callUpId}`);
  }

  for (const applicationId of applicationIds) {
    if (!applicationId) {
      continue;
    }

    revalidatePath(`/dashboard/applications/${applicationId}`);
  }
}

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

    const body = await readJsonSafely(_);
    const hasEditPayload =
      body &&
      typeof body === "object" &&
      Object.keys(body).length > 0;

    let updated;

    if (hasEditPayload) {
      const parsed = createCallUpSchema
        .extend({
          applicationId: z.string().optional().nullable().or(z.literal("")),
          contactId: z.string().optional().nullable().or(z.literal("")),
        })
        .safeParse(body);

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

      updated = await prisma.callUp.update({
        where: { id: callUpId },
        data: {
          title: data.title,
          notes: data.notes || null,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          isSpecificDate: Boolean(data.isSpecificDate),
          applicationId:
            typeof data.applicationId === "string" && data.applicationId.trim()
              ? data.applicationId
              : null,
          contactId:
            typeof data.contactId === "string" && data.contactId.trim()
              ? data.contactId
              : null,
        },
      });
    } else {
      updated = await prisma.callUp.update({
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
    }

    revalidateCallUpPaths(callUpId, callUp.applicationId, updated.applicationId);

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
        applicationId: true,
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

    revalidateCallUpPaths(callUpId, existingCallUp.applicationId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/call-ups/[callUpId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete call-up" },
      { status: 500 },
    );
  }
}
