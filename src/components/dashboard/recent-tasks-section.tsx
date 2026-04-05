import Link from "next/link";

type RecentTask = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  updatedAt: string | Date;
  application: {
    id: string;
    companyName: string;
    roleTitle: string;
  };
};

type RecentTasksSectionProps = {
  tasks: RecentTask[];
};

function formatDate(value: string | Date | null) {
  if (!value) {
    return "No due date";
  }

  return new Date(value).toLocaleDateString();
}

function getDueDateTagClass(value: string | Date | null) {
  if (!value) {
    return "bg-white text-slate-700 ring-1 ring-slate-300";
  }

  const dueDate = new Date(value);
  const today = new Date();
  const dayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dueStart = new Date(
    dueDate.getFullYear(),
    dueDate.getMonth(),
    dueDate.getDate(),
  );
  const diffDays = Math.round(
    (dueStart.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays < 0) {
    return "bg-rose-100 text-rose-900 ring-1 ring-rose-300";
  }

  if (diffDays <= 3) {
    return "bg-amber-100 text-amber-900 ring-1 ring-amber-300";
  }

  return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300";
}

export function RecentTasksSection({ tasks }: RecentTasksSectionProps) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-amber-50/60 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Recent Tasks</h2>
          <p className="mt-1 text-sm text-slate-600">
            The action items that need your attention next.
          </p>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
          {tasks.length} visible
        </span>
      </div>

      {tasks.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center">
          <h3 className="text-lg font-medium text-slate-900">No open tasks</h3>
          <p className="mt-2 text-sm text-slate-600">
            Add tasks to your applications to keep follow-ups and prep visible.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {task.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600">
                      {task.application.companyName} • {task.application.roleTitle}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${getDueDateTagClass(task.dueDate)}`}
                  >
                    Due {formatDate(task.dueDate)}
                  </span>
                </div>

                {task.description ? (
                  <p className="text-sm text-slate-600">{task.description}</p>
                ) : null}

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-slate-500">
                    Updated {formatDate(task.updatedAt)}
                  </p>

                  <Link
                    href={`/dashboard/applications/${task.application.id}`}
                    className="inline-flex rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open application
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
