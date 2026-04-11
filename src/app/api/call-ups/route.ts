import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await req.json();

const callUp = await prisma.callUp.create({
  data: {
    title: body.title,
    notes: body.notes,
    scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
    isSpecificDate: Boolean(body.isSpecificDate),
    applicationId: body.applicationId || null,
    contactId: body.contactId,
    userId: user.id,
  },
});

  return NextResponse.json(callUp);
}
