import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createApplicationSchema } from "@/lib/validations/application";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

function revalidateApplicationPaths(id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/archive");
  revalidatePath("/dashboard/applications");
  revalidatePath(`/dashboard/applications/${id}`);
  revalidatePath(`/dashboard/applications/${id}/edit`);
}

export async function GET(_: Request, context: RouteContext) {
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
      include: {
        interviews: {
          orderBy: {
            createdAt: "desc",
          },
        },
        notes: {
          orderBy: {
            createdAt: "desc",
          },
        },
        tasks: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(application, { status: 200 });
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
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
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = createApplicationSchema.safeParse(body);

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

    const updatedApplication = await prisma.jobApplication.update({
      where: {
        id,
      },
      data: {
        companyName: data.companyName,
        roleTitle: data.roleTitle,
        location: data.location || null,
        workMode: data.workMode ?? null,
        jobUrl: data.jobUrl || null,
        jobDescription: data.jobDescription || null,
        status: data.status,
        priority: data.priority,
      },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        location: true,
        workMode: true,
        status: true,
        priority: true,
        jobUrl: true,
        jobDescription: true,
        updatedAt: true,
      },
    });

    revalidateApplicationPaths(id);

    return NextResponse.json(updatedApplication, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/applications/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to update application" },
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

    const { id } = await context.params;

    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingApplication) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 },
      );
    }

    await prisma.jobApplication.delete({
      where: {
        id,
      },
    });

    revalidateApplicationPaths(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/applications/[id] error:", error);

    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 },
    );
  }
}
