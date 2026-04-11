import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { CallUpDetailView } from "@/components/dashboard/call-up-detail-view";

type CallUpDetailPageProps = {
  params: Promise<{
    callUpId: string;
  }>;
};

export default async function CallUpDetailPage({
  params,
}: CallUpDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { callUpId } = await params;

  const [callUp, applications, contacts] = await Promise.all([
    prisma.callUp.findFirst({
      where: {
        id: callUpId,
        userId: session.user.id,
      },
      include: {
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
            status: true,
          },
        },
        contact: {
          select: {
            id: true,
            fullName: true,
            companyName: true,
            jobTitle: true,
            email: true,
            phone: true,
            linkedinUrl: true,
          },
        },
      },
    }),
    prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        status: true,
      },
    }),
    prisma.contact.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        jobTitle: true,
        email: true,
        phone: true,
        linkedinUrl: true,
      },
    }),
  ]);

  if (!callUp) {
    notFound();
  }

  return (
    <CallUpDetailView
      initialCallUp={callUp}
      applications={applications}
      contacts={contacts}
    />
  );
}
