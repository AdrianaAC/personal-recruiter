import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getAppliedAtForWorkflow,
  syncApplicationWorkflowTask,
} from "@/lib/application-workflow";
import { createApplicationSchema } from "@/lib/validations/application";

function revalidateApplicationPaths(id: string) {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/applications");
  revalidatePath("/dashboard/tasks");
  revalidatePath("/dashboard/tasks/archive");
  revalidatePath(`/dashboard/applications/${id}`);
}

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
        archivedAt: null,
      },
      orderBy: {
        createdAt: "desc",
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
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(applications, { status: 200 });
  } catch (error) {
    console.error("GET /api/applications error:", error);

    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const application = await prisma.$transaction(async (tx) => {
      const createdApplication = await tx.jobApplication.create({
        data: {
          userId: session.user.id,
          companyName: data.companyName,
          roleTitle: data.roleTitle,
          location: data.location || null,
          workMode: data.workMode ?? null,
          jobUrl: data.jobUrl || null,
          jobDescription: data.jobDescription || null,
          status: data.status,
          priority: data.priority,
          appliedAt: getAppliedAtForWorkflow(null, data.status),
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
          createdAt: true,
        },
      });

      if (data.applicationNotes) {
        await tx.note.create({
          data: {
            applicationId: createdApplication.id,
            title: "Initial notes",
            content: data.applicationNotes,
          },
        });
      }

      if (data.contactName) {
        const existingContact = await tx.contact.findFirst({
          where: {
            userId: session.user.id,
            fullName: data.contactName,
            companyName: data.companyName,
          },
          select: {
            id: true,
          },
        });

        const contactId =
          existingContact?.id ??
          (
            await tx.contact.create({
              data: {
                userId: session.user.id,
                fullName: data.contactName,
                companyName: data.companyName,
              },
              select: {
                id: true,
              },
            })
          ).id;

        await tx.applicationContact.create({
          data: {
            applicationId: createdApplication.id,
            contactId,
            role: "OTHER",
          },
        });
      }

      await syncApplicationWorkflowTask(tx, createdApplication.id);

      return createdApplication;
    });

    revalidateApplicationPaths(application.id);

    return NextResponse.json(application, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications error:", error);

    return NextResponse.json(
      { error: "Failed to create application" },
      { status: 500 },
    );
  }
}
