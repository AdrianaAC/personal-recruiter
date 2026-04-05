import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateApplicationContactSchema } from "@/lib/validations/contact";

type RouteContext = {
  params: Promise<{
    applicationContactId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationContactId } = await context.params;
    const body = await request.json();

    const parsed = updateApplicationContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid application contact data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existingRelation = await prisma.applicationContact.findFirst({
      where: {
        id: applicationContactId,
        contact: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        applicationId: true,
        contactId: true,
      },
    });

    if (!existingRelation) {
      return NextResponse.json(
        { error: "Application contact not found." },
        { status: 404 },
      );
    }

    const duplicateRelation = await prisma.applicationContact.findFirst({
      where: {
        applicationId: existingRelation.applicationId,
        contactId: existingRelation.contactId,
        role: parsed.data.role,
        NOT: {
          id: applicationContactId,
        },
      },
      select: {
        id: true,
      },
    });

    if (duplicateRelation) {
      return NextResponse.json(
        { error: "This contact already has that role on this application." },
        { status: 409 },
      );
    }

    const updatedRelation = await prisma.applicationContact.update({
      where: {
        id: applicationContactId,
      },
      data: {
        role: parsed.data.role,
      },
      include: {
        contact: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(updatedRelation);
  } catch (error) {
    console.error(
      "PATCH /api/application-contacts/[applicationContactId] error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to update application contact." },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { applicationContactId } = await context.params;

    const existingRelation = await prisma.applicationContact.findFirst({
      where: {
        id: applicationContactId,
        contact: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!existingRelation) {
      return NextResponse.json(
        { error: "Application contact not found." },
        { status: 404 },
      );
    }

    await prisma.applicationContact.delete({
      where: {
        id: applicationContactId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(
      "DELETE /api/application-contacts/[applicationContactId] error:",
      error,
    );

    return NextResponse.json(
      { error: "Failed to remove application contact." },
      { status: 500 },
    );
  }
}