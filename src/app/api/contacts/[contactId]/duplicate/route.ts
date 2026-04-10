import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    contactId: string;
  }>;
};

export async function POST(_: Request, context: RouteContext) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { contactId } = await context.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        userId: session.user.id,
      },
      select: {
        fullName: true,
        email: true,
        phone: true,
        linkedinUrl: true,
        companyName: true,
        jobTitle: true,
        notes: true,
        applications: {
          select: {
            applicationId: true,
            role: true,
          },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ error: "Contact not found." }, { status: 404 });
    }

    const duplicatedContact = await prisma.contact.create({
      data: {
        userId: session.user.id,
        fullName: contact.fullName,
        email: contact.email,
        phone: contact.phone,
        linkedinUrl: contact.linkedinUrl,
        companyName: contact.companyName,
        jobTitle: contact.jobTitle,
        notes: contact.notes,
        applications: contact.applications.length
          ? {
              create: contact.applications.map((applicationLink) => ({
                applicationId: applicationLink.applicationId,
                role: applicationLink.role,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        linkedinUrl: true,
        companyName: true,
        jobTitle: true,
        updatedAt: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: duplicatedContact.id,
      fullName: duplicatedContact.fullName,
      email: duplicatedContact.email,
      linkedinUrl: duplicatedContact.linkedinUrl,
      companyName: duplicatedContact.companyName,
      jobTitle: duplicatedContact.jobTitle,
      updatedAt: duplicatedContact.updatedAt,
      applicationLinksCount: duplicatedContact._count.applications,
    });
  } catch (error) {
    console.error("POST /api/contacts/[contactId]/duplicate error:", error);

    return NextResponse.json(
      { error: "Failed to duplicate contact." },
      { status: 500 },
    );
  }
}
