import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createCallUpSchema } from "@/lib/validations/call-up";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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
    const parsed = createCallUpSchema.safeParse(body);

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
    const contactId = data.contactId || null;

    if (contactId) {
      const linkedContact = await prisma.applicationContact.findFirst({
        where: {
          applicationId,
          contactId,
          application: {
            userId: session.user.id,
          },
        },
        select: {
          id: true,
        },
      });

      if (!linkedContact) {
        return NextResponse.json(
          { error: "Selected contact is not attached to this application" },
          { status: 400 },
        );
      }
    }

    const callUp = await prisma.callUp.create({
      data: {
        userId: session.user.id,
        applicationId,
        contactId,
        title: data.title,
        notes: data.notes || null,
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      },
      select: {
        id: true,
        title: true,
        notes: true,
        scheduledAt: true,
        status: true,
        createdAt: true,
        updatedAt: true,
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

    return NextResponse.json(callUp, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications/[id]/call-ups error:", error);

    return NextResponse.json(
      { error: "Failed to create call-up" },
      { status: 500 },
    );
  }
}
