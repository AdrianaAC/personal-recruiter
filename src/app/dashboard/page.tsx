import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecentApplicationsSection } from "@/components/dashboard/recent-applications-section";
import { RecentTasksSection } from "@/components/dashboard/recent-tasks-section";
import { RecentCallUpsSection } from "@/components/dashboard/recent-callups-section";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";

function BriefcaseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        d="M4 9h16v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 9V7a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 13h16" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M21 3L10 14" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M21 3L14 21l-4-7-7-4 18-7Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path d="M12 3v5" strokeLinecap="round" />
      <path d="m5.6 6.6 3.5 3.5" strokeLinecap="round" />
      <path d="M3 12h5" strokeLinecap="round" />
      <path d="m18.4 6.6-3.5 3.5" strokeLinecap="round" />
      <path d="m8.5 15.5 3.5-8 3.5 8-3.5 5-3.5-5Z" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        d="M7.5 4h3l1.2 3.2-1.8 1.8a15 15 0 0 0 5 5l1.8-1.8L20 13.5v3A1.5 1.5 0 0 1 18.5 18C10.5 18 6 13.5 6 5.5A1.5 1.5 0 0 1 7.5 4Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const [
    applications,
    contacts,
    openTasksCount,
    callUpsCount,
    recentTasks,
    recentCallUps,
  ] = await Promise.all([
    prisma.jobApplication.findMany({
      where: {
        userId: session.user.id,
        archivedAt: null,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        companyName: true,
        roleTitle: true,
        nextStep: true,
        status: true,
        priority: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.contact.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        fullName: "asc",
      },
      select: {
        id: true,
        fullName: true,
        companyName: true,
        jobTitle: true,
      },
    }),
    prisma.task.count({
      where: {
        userId: session.user.id,
        completed: false,
        archivedAt: null,
      },
    }),
    prisma.callUp.count({
      where: {
        userId: session.user.id,
        archivedAt: null,
        contactId: {
          not: null,
        },
      },
    }),
    prisma.task.findMany({
      where: {
        userId: session.user.id,
        completed: false,
        archivedAt: null,
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        updatedAt: true,
        application: {
          select: {
            id: true,
            companyName: true,
            roleTitle: true,
          },
        },
      },
    }),
    prisma.callUp.findMany({
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
      take: 5,
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
    }),
  ]);

  const totalApplications = applications.length;

  const inProcessStatuses = [
    "SCREENING",
    "TECHNICAL_INTERVIEW",
    "TAKE_HOME",
    "FINAL_INTERVIEW",
  ];

  const inProcessCount = applications.filter((application) =>
    inProcessStatuses.includes(application.status),
  ).length;

  const latestApplication = applications[0] ?? null;

  const heroHeadline =
    inProcessCount > 0
      ? `${inProcessCount} application${
          inProcessCount === 1 ? "" : "s"
        } actively moving through your pipeline.`
      : openTasksCount > 0
        ? `${openTasksCount} open task${
            openTasksCount === 1 ? "" : "s"
          } ready for your next session.`
        : totalApplications > 0
          ? "Your search board is live and ready for the next move."
          : "Build a job search board that actually feels alive.";

  const heroDescription = latestApplication
    ? `Current focus: ${latestApplication.companyName} for ${latestApplication.roleTitle}. Keep the next step visible and the momentum steady.`
    : "Track each role, save context as you go, and turn your pipeline into something you can actually manage day to day.";

  const dashboardStats = [
    {
      label: "Total Applications",
      value: totalApplications,
      subtitle: "Every opportunity in your tracker.",
      classes:
        "border-slate-200 bg-gradient-to-br from-white via-white to-slate-100/80",
      iconClasses: "bg-slate-900 text-white",
      icon: <BriefcaseIcon />,
    },
    {
      label: "In Process",
      value: inProcessCount,
      subtitle: "Screens, interviews, and take-homes.",
      classes:
        "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-white",
      iconClasses: "bg-violet-600 text-white",
      icon: <SparkIcon />,
    },
    {
      label: "Tasks",
      value: openTasksCount,
      subtitle: "Open actions across your workflow.",
      classes:
        "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-white",
      iconClasses: "bg-amber-500 text-white",
      icon: <SendIcon />,
    },
    {
      label: "Calls",
      value: callUpsCount,
      subtitle: "Contacts tied to active opportunities.",
      classes:
        "border-sky-200 bg-gradient-to-br from-sky-50 via-white to-white",
      iconClasses: "bg-sky-600 text-white",
      icon: <PhoneIcon />,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-amber-50/60 to-sky-50/70 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-medium text-slate-500">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Welcome back{session.user.name ? `, ${session.user.name}` : ""}.
            </h1>
            <p className="mt-3 text-lg font-medium text-slate-800">
              {heroHeadline}
            </p>
            <p className="mt-2 text-sm text-slate-600">{heroDescription}</p>

            <div className="mt-4 mb-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {totalApplications} tracked
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {inProcessCount} active
              </span>
              <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                {openTasksCount} tasks
              </span>
              {latestApplication ? (
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                  Latest: {latestApplication.companyName}
                </span>
              ) : null}
            </div>

            <DashboardQuickActions
              applications={applications}
              contacts={contacts}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/applications/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white shadow-sm"
            >
              New application
            </Link>

            <Link
              href="/dashboard/applications"
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium shadow-sm"
            >
              View applications
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {dashboardStats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border p-5 shadow-sm ${stat.classes}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {stat.label}
                </p>
                <p className="mt-3 text-3xl font-semibold text-slate-950">
                  {stat.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">{stat.subtitle}</p>
              </div>

              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${stat.iconClasses}`}
              >
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </section>

      <RecentApplicationsSection applications={applications} />

      <section className="grid gap-6 xl:grid-cols-2">
        <RecentTasksSection tasks={recentTasks} />
        <RecentCallUpsSection callUps={recentCallUps} />
      </section>
    </div>
  );
}
