import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  if (!body.fullName) {
    return NextResponse.json(
      { error: "Full name is required" },
      { status: 400 },
    );
  }

  const contact = await prisma.contact.create({
    data: {
      userId: session.user.id,
      fullName: body.fullName,
      email: body.email || null,
      linkedinUrl: body.linkedinUrl || null,
      companyName: body.companyName || null,
      jobTitle: body.jobTitle || null,
    },
  });

  return NextResponse.json(contact);
}