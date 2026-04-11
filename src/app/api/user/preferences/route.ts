import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { syncUserApplicationWorkflowTasks } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";

const updateUserPreferencesSchema = z.object({
  autoThankYouReminderEnabled: z.boolean(),
});

export async function PATCH(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateUserPreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: session.user.id,
      },
      data: {
        autoThankYouReminderEnabled: parsed.data.autoThankYouReminderEnabled,
      },
      select: {
        autoThankYouReminderEnabled: true,
      },
    });

    await syncUserApplicationWorkflowTasks(prisma, session.user.id);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tasks");
    revalidatePath("/dashboard/applications");

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("PATCH /api/user/preferences error:", error);

    return NextResponse.json(
      { error: "Failed to update user preferences" },
      { status: 500 },
    );
  }
}
