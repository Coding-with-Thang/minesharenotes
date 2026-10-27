import Link from "next/link";
import { listTasks } from "@/app/actions/tasks";
import { TagList } from "@/components/tag-list";
import { withNoteFilters } from "@/lib/note-filters";
import { formatWhen, reminderStatus, type ReminderStatus } from "@/lib/time";

export function ReminderLists({
  tasks,
  now,
  timezone,
  query,
  category = "",
}: {
  tasks: Awaited<ReturnType<typeof listTasks>>;
  now: Date;
  timezone: string;
  query: string;
  category?: string;
}) {
  const active = tasks.filter((task) => reminderStatus(task.dueAt, task.completedAt, now) === "active");
  const archive = tasks.filter((task) => reminderStatus(task.dueAt, task.completedAt, now) !== "active");

  return (
    <div className="grid gap-4">
      <ReminderGroup
        title="Active"
        empty="No active reminders."
        tasks={active}
        now={now}
        timezone={timezone}
        query={query}
        category={category}
      />
      <ReminderGroup
        title="Completed / expired"
        empty="No completed or expired reminders."
        tasks={archive}
        now={now}
        timezone={timezone}
        query={query}
        category={category}
      />
    </div>
  );
}

function ReminderGroup({
  title,
  empty,
  tasks,
  now,
  timezone,
  query,
  category,
}: {
  title: string;
  empty: string;
  tasks: Awaited<ReturnType<typeof listTasks>>;
  now: Date;
  timezone: string;
  query: string;
  category: string;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="flex items-baseline gap-2 text-lg font-semibold">
        {title}
        <span className="text-muted text-sm font-normal">{tasks.length}</span>
      </h2>
      {tasks.length === 0 ? (
        <p className="text-muted text-sm">{empty}</p>
      ) : (
        <ul className="grid gap-2">
          {tasks.map((task) => {
            const status = reminderStatus(task.dueAt, task.completedAt, now);
            const href = withNoteFilters(`/reminders/${task.id}`, query, category);
            return (
              <li key={task.id}>
                <Link
                  href={href}
                  className="border-line bg-card hover:border-accent block min-w-0 rounded-2xl border px-4 py-3"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`font-medium ${status === "completed" ? "text-muted line-through" : ""}`}>
                      {task.title}
                    </span>
                    <StatusBadge status={status} />
                  </span>
                  <span className="text-muted mt-1 block text-sm">
                    Due {formatWhen(task.dueAt, timezone)}
                  </span>
                  <TagList tags={task.tags} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: ReminderStatus }) {
  const label = status === "completed" ? "Completed" : status === "expired" ? "Expired" : "Active";
  const tone =
    status === "completed" ? "text-muted" : status === "expired" ? "text-danger" : "text-accent";
  return <span className={`text-xs font-semibold ${tone}`}>{label}</span>;
}
