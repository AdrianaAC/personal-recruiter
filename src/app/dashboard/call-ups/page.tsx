import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";
import { RecentContactsSection } from "@/components/dashboard/recent-contacts-section";

export default async function CallUpsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const callUps = await prisma.callUp.findMany({
    where: {
      userId: session.user.id,
      archivedAt: null,
      contactId: {
        not: null,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    select: {
      id: true,
      title: true,
      description: true,
      notes: true,
      scheduledAt: true,
      status: true,
      updatedAt: true,
      contact: {
        select: {
          id: true,
          fullName: true,
          email: true,
          linkedinUrl: true,
          companyName: true,
          jobTitle: true,
        },
      },
      application: {
        select: {
          id: true,
          companyName: true,
          roleTitle: true,
        },
      },
    },
  });

  const applications = await prisma.jobApplication.findMany({
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
    },
  });

  const contacts = await prisma.contact.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      fullName: "asc",
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      linkedinUrl: true,
      companyName: true,
      jobTitle: true,
      notes: true,
      updatedAt: true,
      applications: {
        take: 1,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          application: {
            select: {
              id: true,
              companyName: true,
              roleTitle: true,
            },
          },
        },
      },
      _count: {
        select: {
          applications: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            FollowUps
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Everything that still needs a follow-up
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Back to dashboard
          </Link>

          <Link
            href="/dashboard/archive"
            className="inline-flex items-center rounded-full border border-sky-300 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-900 transition hover:bg-sky-100"
          >
            Archive
          </Link>
        </div>
      </div>

      <RecentCallUpsSection
        callUps={callUps}
        title="FollowUps"
        description=""
        viewHref={null}
        showAddCallUpAction
        largeAddCallUpAction
        enableCallUpEditing
        showDeleteAction
        showCopyAction
        addCallUpApplications={applications}
        addCallUpContacts={contacts}
      />

      <RecentContactsSection
        contacts={contacts.map((contact) => ({
          ...contact,
          applicationLinksCount: contact._count.applications,
        }))}
        title="Contacts"
        description="The people connected to your outreach and opportunities."
        viewHref={null}
        showAddContactAction
        largeAddContactAction
        enableContactEditing
      />
    </div>
  );
}
