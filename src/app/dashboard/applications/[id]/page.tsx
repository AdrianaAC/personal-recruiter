import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getApplicationNextStepStatus } from "@/lib/application-next-step";
import { getApplicationStaleness } from "@/lib/application-staleness";
import { syncApplicationWorkflowTask } from "@/lib/application-workflow";
import { prisma } from "@/lib/prisma";
import { ApplicationNotes } from "@/components/applications/application-notes";
import { ApplicationTasks } from "@/components/applications/application-tasks";
import { ApplicationInterviews } from "@/components/applications/application-interviews";
import { ApplicationSummaryCards } from "@/components/applications/application-summary-cards";
import { ApplicationNextInterview } from "@/components/applications/application-next-interview";
import { ApplicationActivityTimeline } from "@/components/applications/application-activity-timeline";
import { ApplicationContacts } from "@/components/applications/application-contacts";
import { ApplicationCallUps } from "@/components/applications/application-call-ups";
import { ApplicationCallUpList } from "@/components/applications/application-call-up-list";

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

function getStalenessTagClass(level: "warning" | "stale" | "archive") {
  switch (level) {
    case "warning":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "stale":
      return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
    case "archive":
      return "bg-slate-900 text-white ring-1 ring-slate-800";
  }
}

export default async function ApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  const accessCheck = await prisma.jobApplication.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
    },
  });

  if (!accessCheck) {
    notFound();
  }

  await prisma.$transaction(async (tx) => {
    await syncApplicationWorkflowTask(tx, id);
  });

  const application = await prisma.jobApplication.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      contacts: {
        include: {
          contact: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
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
      callUps: {
        include: {
          contact: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  if (!application) {
    notFound();
  }

  const openTasksCount = application.tasks.filter(
    (task) => !task.completed,
  ).length;

  const completedTasksCount = application.tasks.filter(
    (task) => task.completed,
  ).length;

  const nextInterview =
    application.interviews
      .filter((i) => i.scheduledAt)
      .sort(
        (a, b) =>
          new Date(a.scheduledAt as Date).getTime() -
          new Date(b.scheduledAt as Date).getTime(),
      )[0] ?? null;

  const staleness = getApplicationStaleness(application);
  const nextStepStatus = getApplicationNextStepStatus(application);

  const timelineItems = [
    {
      id: `application-created-${application.id}`,
      kind: "application" as const,
      title: "Application saved",
      description: `${application.companyName} — ${application.roleTitle}`,
      timestamp: application.createdAt,
      meta: formatLabel(application.status),
    },

    ...application.notes.map((note) => ({
      id: `note-${note.id}`,
      kind: "note" as const,
      title: "Note added",
      description: note.content || "No content",
      timestamp: note.createdAt,
      meta: null,
    })),

    ...application.tasks.map((task) => ({
      id: `task-${task.id}`,
      kind: "task" as const,
      title: task.completed ? "Task completed" : "Task created",
      description: task.title,
      timestamp: task.updatedAt ?? task.createdAt,
      meta: task.completed ? "Completed" : "Open",
    })),

    ...application.callUps.map((callUp) => ({
      id: `call-up-${callUp.id}`,
      kind: "application" as const,
      title: "FollowUp added",
      description: callUp.contact
        ? `${callUp.title} - ${callUp.contact.fullName}`
        : callUp.title,
      timestamp: callUp.updatedAt ?? callUp.createdAt,
      meta: formatLabel(callUp.status),
    })),

    ...application.interviews.map((interview) => ({
      id: `interview-${interview.id}`,
      kind: "interview" as const,
      title: interview.stageName || "Interview activity",
      description:
        interview.notes || interview.locationOrLink || "Interview recorded",
      timestamp: interview.updatedAt ?? interview.createdAt,
      meta: interview.type,
    })),

    ...application.contacts.map((applicationContact) => ({
      id: `contact-${applicationContact.id}`,
      kind: "application" as const,
      title: "Contact attached",
      description: `${applicationContact.contact.fullName}${
        applicationContact.contact.jobTitle
          ? ` — ${applicationContact.contact.jobTitle}`
          : ""
      }${
        applicationContact.contact.companyName
          ? ` • ${applicationContact.contact.companyName}`
          : ""
      }`,
      timestamp: applicationContact.createdAt,
      meta: formatLabel(applicationContact.role),
    })),
  ].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

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

            {staleness ? (
              <span
                className={`rounded-full px-3 py-1 font-medium ${getStalenessTagClass(
                  staleness.level,
                )}`}
                title={staleness.description}
              >
                {staleness.label}
              </span>
            ) : null}

            {nextStepStatus.isMissingNextStep ? (
              <span className="rounded-full bg-amber-50 px-3 py-1 font-medium text-amber-800 ring-1 ring-amber-200">
                Missing next step
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <ApplicationSummaryCards
        status={application.status}
        stalenessLabel={staleness?.label ?? null}
        stalenessHelper={
          staleness
            ? `${staleness.description} Consider nudging or archiving if it stays quiet.`
            : null
        }
        missingNextStepDetected={nextStepStatus.isMissingNextStep}
        missingNextStepMessage={nextStepStatus.message}
        notesCount={application.notes.length}
        openTasksCount={openTasksCount}
        completedTasksCount={completedTasksCount}
        interviewsCount={application.interviews.length}
        nextInterviewAt={nextInterview?.scheduledAt ?? null}
      />

      <ApplicationNextInterview interview={nextInterview} />

      <ApplicationActivityTimeline items={timelineItems} />

      <ApplicationContacts
        applicationId={application.id}
        initialContacts={application.contacts}
      />

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

            {application.offerReceivedAt ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Offer received
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(application.offerReceivedAt).toLocaleDateString()}
                </dd>
              </div>
            ) : null}

            {application.offerExpiresAt ? (
              <div>
                <dt className="text-sm font-medium text-gray-500">
                  Offer expiration
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(application.offerExpiresAt).toLocaleDateString()}
                </dd>
              </div>
            ) : null}

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
            <div className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
              {application.jobDescription || "No job description saved yet."}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Next Step</h3>
            <div
              className={`mt-2 rounded-lg p-4 text-sm ${
                nextStepStatus.isMissingNextStep
                  ? "border border-amber-200 bg-amber-50 text-amber-900"
                  : "bg-gray-50 text-gray-800"
              }`}
            >
              {application.nextStep ||
                nextStepStatus.message ||
                "No next step defined yet."}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-500">Notes Summary</h3>
            <div className="mt-2 whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-800">
              {application.notesSummary || "No summary yet."}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <ApplicationTasks
            applicationId={application.id}
            initialTasks={application.tasks}
            extraContent={
              <ApplicationCallUps
                applicationId={application.id}
                contacts={application.contacts.map((item) => ({
                  id: item.contact.id,
                  fullName: item.contact.fullName,
                  companyName: item.contact.companyName,
                  jobTitle: item.contact.jobTitle,
                }))}
              />
            }
          />

          <ApplicationCallUpList callUps={application.callUps} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <ApplicationNotes
            applicationId={application.id}
            initialNotes={application.notes}
          />
        </div>

        <ApplicationInterviews
          applicationId={application.id}
          initialInterviews={application.interviews}
        />
      </section>
    </div>
  );
}
