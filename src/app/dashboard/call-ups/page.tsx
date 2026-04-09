import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">FollowUps</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
            All Recent FollowUps
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            FollowUps and warm contacts that are still in motion.
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
        description="FollowUps and warm contacts that are still in motion."
        viewHref={null}
      />
    </div>
  );
}
