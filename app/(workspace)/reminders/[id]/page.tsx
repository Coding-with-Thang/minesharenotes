import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReminderActions } from "@/components/reminder-actions";
import { TagList } from "@/components/tag-list";
import { WorkspaceSplit } from "@/components/workspace-split";
import { requireUser } from "@/lib/auth";
import { noteFilters, type NoteSearchParams } from "@/lib/note-filters";
import { formatWhen, isoToDatetimeLocal, reminderStatus } from "@/lib/time";
import { formatTags } from "@/lib/validators";
import { withDb } from "@/src/prisma/db";

export const instant = false;

type ReminderRoute = {
  params: Promise<{ id: string }>;
  searchParams: Promise<NoteSearchParams>;
};

const statusLabel = {
  active: "Active",
  expired: "Expired",
  completed: "Completed",
} as const;

export default function ReminderPage(props: ReminderRoute) {
  return (
    <Suspense fallback={<p className="text-muted">Loading reminder…</p>}>
      <ReminderScreen {...props} />
    </Suspense>
  );
}

async function ReminderScreen({ params, searchParams }: ReminderRoute) {
  const user = await requireUser();
  const { id } = await params;
  const { query, category } = noteFilters(await searchParams);
  const now = new Date();
  const task = await withDb((db) =>
    db.orm.public.Task.select("id", "title", "description", "dueAt", "completedAt", "tags")
      .where({ id, userId: user.id })
      .first(),
  );

  if (!task) notFound();

  const status = reminderStatus(task.dueAt, task.completedAt, now);

  return (
    <WorkspaceSplit query={query} category={category} activeReminderId={task.id}>
      <article className="border-line bg-card grid min-w-0 gap-4 rounded-2xl border p-4 sm:p-5">
        <p className="text-muted text-xs font-semibold tracking-wide uppercase">{statusLabel[status]}</p>
        <h1 className={`text-2xl font-semibold tracking-tight ${status === "completed" ? "line-through" : ""}`}>
          {task.title}
        </h1>
        {task.description ? <p className="whitespace-pre-wrap text-sm">{task.description}</p> : null}
        <TagList tags={task.tags} />
        <dl className="grid gap-1 text-sm">
          <div>
            <dt className="text-muted inline">Due </dt>
            <dd className="inline">{formatWhen(task.dueAt, user.timezone)}</dd>
          </div>
          {task.completedAt ? (
            <div>
              <dt className="text-muted inline">Completed </dt>
              <dd className="inline">{formatWhen(task.completedAt, user.timezone)}</dd>
            </div>
          ) : null}
        </dl>
        <ReminderActions
          id={task.id}
          title={task.title}
          description={task.description ?? ""}
          dueAt={isoToDatetimeLocal(task.dueAt, user.timezone)}
          tags={formatTags(task.tags)}
          status={status}
        />
      </article>
    </WorkspaceSplit>
  );
}
