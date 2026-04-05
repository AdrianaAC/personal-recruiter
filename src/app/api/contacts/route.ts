import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createContactSchema } from "@/lib/validations/contact";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("GET /api/contacts error:", error);

    return NextResponse.json(
      { error: "Failed to fetch contacts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createContactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid contact data.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const {
      applicationId,
      role,
      fullName,
      email,
      phone,
      linkedinUrl,
      companyName,
      jobTitle,
      notes,
    } = parsed.data;

    if (applicationId) {
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
          { error: "Application not found." },
          { status: 404 },
        );
      }
    }

    const createdContact = await prisma.$transaction(async (tx) => {
      const contact = await tx.contact.create({
        data: {
          userId: session.user.id,
          fullName,
          email: email || null,
          phone: phone || null,
          linkedinUrl: linkedinUrl || null,
          companyName: companyName || null,
          jobTitle: jobTitle || null,
          notes: notes || null,
        },
      });

      if (applicationId) {
        await tx.applicationContact.create({
          data: {
            applicationId,
            contactId: contact.id,
            role: role ?? "OTHER",
          },
        });
      }

      return tx.contact.findUnique({
        where: {
          id: contact.id,
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
    });

    return NextResponse.json(createdContact, { status: 201 });
  } catch (error) {
    console.error("POST /api/contacts error:", error);

    return NextResponse.json(
      { error: "Failed to create contact." },
      { status: 500 },
    );
  }
}
