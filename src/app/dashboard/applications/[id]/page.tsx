import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ApplicationNotes } from "@/components/applications/application-notes";

type ApplicationDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const application = await prisma.jobApplication.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      interviews: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
      tasks: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            href="/dashboard/applications"
            className="text-sm text-gray-500 underline"
          >
            ← Back to applications
          </Link>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {application.companyName}
          </h1>

          <p className="text-sm text-gray-700">{application.roleTitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/dashboard/applications/${application.id}/edit`}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium"
          >
            Edit
          </Link>

          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
            <span className="rounded-full bg-gray-100 px-3 py-1">
              {formatLabel(application.status)}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1">
              Priority: {formatLabel(application.priority)}
            </span>

            {application.workMode ? (
              <span className="rounded-full bg-gray-100 px-3 py-1">
                {formatLabel(application.workMode)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold">Application Overview</h2>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {application.companyName}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {application.roleTitle}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {application.location || "—"}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Work Mode</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {application.workMode ? formatLabel(application.workMode) : "—"}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatLabel(application.status)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Priority</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {formatLabel(application.priority)}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(application.createdAt).toLocaleDateString()}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(application.updatedAt).toLocaleDateString()}
              </dd>
            </div>

            {application.jobUrl ? (
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Job URL</dt>
                <dd className="mt-1">
                  <a
                    href={application.jobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 underline"
                  >
                    Open job posting
                  </a>
                </dd>
              </div>
            ) : null}
          </dl>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">
              Job Description
            </h3>
            <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {application.jobDescription || "No job description saved yet."}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Next Step</h3>
            <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
              {application.nextStep || "No next step defined yet."}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Notes Summary</h3>
            <div className="mt-2 rounded-lg bg-gray-50 p-4 text-sm text-gray-800 whitespace-pre-wrap">
              {application.notesSummary || "No summary yet."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Quick Stats</h2>

            <div className="mt-4 grid gap-3">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Interviews</p>
                <p className="mt-1 text-2xl font-semibold">
                  {application.interviews.length}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Notes</p>
                <p className="mt-1 text-2xl font-semibold">
                  {application.notes.length}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Tasks</p>
                <p className="mt-1 text-2xl font-semibold">
                  {application.tasks.length}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">Tasks Preview</h2>

            {application.tasks.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                No tasks yet for this application.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {application.tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-medium text-gray-900">
                      {task.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {task.completed ? "Completed" : "Open"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <ApplicationNotes
            applicationId={application.id}
            initialNotes={application.notes}
          />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Recent Interviews</h2>

          {application.interviews.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">
              No interviews recorded yet.
            </p>
          ) : (
            <div className="mt-4 space-y-4">
              {application.interviews.slice(0, 5).map((interview) => (
                <div key={interview.id} className="rounded-lg bg-gray-50 p-4">
                  <p className="text-sm font-medium text-gray-900">
                    {formatLabel(interview.type)}
                    {interview.stageName ? ` — ${interview.stageName}` : ""}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                    {interview.outcome ? (
                      <span className="rounded-full bg-white px-2 py-1">
                        {formatLabel(interview.outcome)}
                      </span>
                    ) : null}

                    {interview.scheduledAt ? (
                      <span className="rounded-full bg-white px-2 py-1">
                        {new Date(interview.scheduledAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  {interview.notes ? (
                    <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {interview.notes}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
