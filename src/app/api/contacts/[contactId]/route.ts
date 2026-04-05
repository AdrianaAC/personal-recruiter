import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { updateContactSchema } from "@/lib/validations/contact";

type RouteContext = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { contactId } = await context.params;
    const body = await request.json();

    const parsed = updateContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid contact data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found." },
        { status: 404 },
      );
    }

    const updatedContact = await prisma.contact.update({
      where: {
        id: contactId,
      },
      data: {
        ...(parsed.data.fullName !== undefined
          ? { fullName: parsed.data.fullName }
          : {}),
        ...(parsed.data.email !== undefined
          ? { email: parsed.data.email || null }
          : {}),
        ...(parsed.data.phone !== undefined
          ? { phone: parsed.data.phone || null }
          : {}),
        ...(parsed.data.linkedinUrl !== undefined
          ? { linkedinUrl: parsed.data.linkedinUrl || null }
          : {}),
        ...(parsed.data.companyName !== undefined
          ? { companyName: parsed.data.companyName || null }
          : {}),
        ...(parsed.data.jobTitle !== undefined
          ? { jobTitle: parsed.data.jobTitle || null }
          : {}),
        ...(parsed.data.notes !== undefined
          ? { notes: parsed.data.notes || null }
          : {}),
      },
      include: {
        applications: {
          include: {
            application: {
              select: {
                id: true,
                companyName: true,
                roleTitle: true,
                status: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    return NextResponse.json(updatedContact);
  } catch (error) {
    console.error("PATCH /api/contacts/[contactId] error:", error);

    return NextResponse.json(
      { error: "Failed to update contact." },
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
    const { contactId } = await context.params;

    const existingContact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!existingContact) {
      return NextResponse.json(
        { error: "Contact not found." },
        { status: 404 },
      );
    }

    await prisma.contact.delete({
      where: {
        id: contactId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/contacts/[contactId] error:", error);

    return NextResponse.json(
      { error: "Failed to delete contact." },
      { status: 500 },
    );
  }
}
