import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export default async function ApplicationsPage() {
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
      location: true,
      workMode: true,
      status: true,
      priority: true,
      jobUrl: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Applications
          </h1>
          <p className="text-sm text-gray-600">
            Track your job opportunities in one place.
          </p>
        </div>

        <Link
          href="/dashboard/applications/new"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          New application
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <h2 className="text-lg font-medium">No applications yet</h2>
          <p className="mt-2 text-sm text-gray-600">
            Start by saving your first opportunity.
          </p>

          <Link
            href="/dashboard/applications/new"
            className="mt-4 inline-flex rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Create first application
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {application.companyName}
                    </h2>
                    <p className="text-sm text-gray-700">
                      {application.roleTitle}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {application.location ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {application.location}
                      </span>
                    ) : null}

                    {application.workMode ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        {application.workMode}
                      </span>
                    ) : null}

                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      {application.status}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2 py-1">
                      Priority: {application.priority}
                    </span>
                  </div>

                  {application.jobUrl ? (
                    <a
                      href={application.jobUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block text-sm text-blue-600 underline"
                    >
                      View job post
                    </a>
                  ) : null}
                </div>

                <div className="text-xs text-gray-500">
                  Added {new Date(application.createdAt).toLocaleDateString()}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
