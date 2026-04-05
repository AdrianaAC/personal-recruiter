import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  attachContactToApplicationSchema,
  createContactSchema,
} from "@/lib/validations/contact";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const application = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 },
      );
    }

    const applicationContacts = await prisma.applicationContact.findMany({
      where: {
        applicationId: id,
        contact: {
          userId: session.user.id,
        },
      },
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(applicationContacts);
  } catch (error) {
    console.error("GET /api/applications/[id]/contacts error:", error);

    return NextResponse.json(
      { error: "Failed to fetch application contacts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();

    const application = await prisma.jobApplication.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found." },
        { status: 404 },
      );
    }

    if (body.contactId) {
      const parsed = attachContactToApplicationSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          {
            error: "Invalid application contact data.",
            details: parsed.error.flatten(),
          },
          { status: 400 },
        );
      }

      const contact = await prisma.contact.findFirst({
        where: {
          id: parsed.data.contactId,
          userId: session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (!contact) {
        return NextResponse.json(
          { error: "Contact not found." },
          { status: 404 },
        );
      }

      const existingRelation = await prisma.applicationContact.findFirst({
        where: {
          applicationId: id,
          contactId: parsed.data.contactId,
          role: parsed.data.role,
        },
        select: {
          id: true,
        },
      });

      if (existingRelation) {
        return NextResponse.json(
          { error: "This contact is already attached with that role." },
          { status: 409 },
        );
      }

      const createdRelation = await prisma.applicationContact.create({
        data: {
          applicationId: id,
          contactId: parsed.data.contactId,
          role: parsed.data.role,
        },
        include: {
          contact: true,
        },
      });

      return NextResponse.json(createdRelation, { status: 201 });
    }

    const parsed = createContactSchema.safeParse({
      ...body,
      applicationId: id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid contact data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const createdApplicationContact = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          userId: session.user.id,
          fullName: parsed.data.fullName,
          email: parsed.data.email || null,
          phone: parsed.data.phone || null,
          linkedinUrl: parsed.data.linkedinUrl || null,
          companyName: parsed.data.companyName || null,
          jobTitle: parsed.data.jobTitle || null,
          notes: parsed.data.notes || null,
        },
      });

      const relation = await tx.applicationContact.create({
        data: {
          applicationId: id,
          contactId: contact.id,
          role: parsed.data.role ?? "OTHER",
        },
        include: {
          contact: true,
        },
      });

      return relation;
    });

    return NextResponse.json(createdApplicationContact, { status: 201 });
  } catch (error) {
    console.error("POST /api/applications/[id]/contacts error:", error);

    return NextResponse.json(
      { error: "Failed to create or attach contact." },
      { status: 500 },
    );
  }
}