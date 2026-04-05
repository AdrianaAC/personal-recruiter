import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentApplicationsSection } from "@/components/dashboard/recent-applications-section";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const applications = await prisma.jobApplication.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      companyName: true,
      roleTitle: true,
      status: true,
      priority: true,
      createdAt: true,
    },
  });

  const totalApplications = applications.length;

  const appliedCount = applications.filter(
    (application) => application.status === "APPLIED",
  ).length;

  const inProcessStatuses = [
    "SCREENING",
    "TECHNICAL_INTERVIEW",
    "TAKE_HOME",
    "FINAL_INTERVIEW",
  ];

  const inProcessCount = applications.filter((application) =>
    inProcessStatuses.includes(application.status),
  ).length;

  const offersCount = applications.filter(
    (application) => application.status === "OFFER",
  ).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Welcome back
            {session.user.name ? `, ${session.user.name}` : ""}. Here is your
            current job search overview.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/applications/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            New application
          </Link>

          <Link
            href="/dashboard/applications"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            View applications
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Applications
          </p>
          <p className="mt-3 text-3xl font-semibold">{totalApplications}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Applied</p>
          <p className="mt-3 text-3xl font-semibold">{appliedCount}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">In Process</p>
          <p className="mt-3 text-3xl font-semibold">{inProcessCount}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Offers</p>
          <p className="mt-3 text-3xl font-semibold">{offersCount}</p>
        </div>
      </section>

      <RecentApplicationsSection applications={applications} />
    </div>
  );
}
