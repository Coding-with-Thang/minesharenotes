"use client";

import { useActionState, useState } from "react";
import {
  createTask,
  deleteTask,
  setTaskCompleted,
  updateTask,
  type TaskState,
} from "@/app/actions/tasks";
import { updateTimezone, type AuthState } from "@/app/actions/auth";
import { DeleteButton } from "@/components/delete-button";
import { formatWhen, isoToDatetimeLocal, taskBucket, zonedDayRange, type TaskBucket } from "@/lib/time";

export type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  dueAt: string;
  completedAt: string | null;
};

const buckets: { id: TaskBucket; label: string }[] = [
  { id: "overdue", label: "Overdue" },
  { id: "today", label: "Today" },
  { id: "upcoming", label: "Upcoming" },
  { id: "done", label: "Done" },
];

export function TaskBoard({
  tasks,
  timezone,
  now,
}: {
  tasks: TaskRow[];
  timezone: string;
  now: string;
}) {
  const range = zonedDayRange(timezone, new Date(now));
  const grouped = buckets.map((bucket) => ({
    ...bucket,
    tasks: tasks.filter((task) => taskBucket(task.dueAt, task.completedAt, range) === bucket.id),
  }));

  return (
    <div className="grid gap-8">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="border-line bg-card rounded-2xl border p-5">
          <h2 className="text-lg font-semibold">Add a task</h2>
          <p className="text-muted mt-1 text-sm">Due times use {timezone}.</p>
          <TaskForm action={createTask} submitLabel="Add task" />
        </div>
        <TimezoneCard timezone={timezone} />
      </section>
      {grouped.map((group) => (
        <section key={group.id} className="grid gap-3">
          <h2 className="flex items-baseline gap-2 text-lg font-semibold">
            {group.label}
            <span className="text-muted text-sm font-normal">{group.tasks.length}</span>
          </h2>
          {group.tasks.length === 0 ? (
            <p className="text-muted text-sm">Nothing here.</p>
          ) : (
            <ul className="grid gap-3">
              {group.tasks.map((task) => (
                <li key={task.id} className="border-line bg-card rounded-2xl border p-4">
                  <TaskItem task={task} timezone={timezone} done={group.id === "done"} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

function TaskItem({ task, timezone, done }: { task: TaskRow; timezone: string; done: boolean }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className={`font-medium ${done ? "text-muted line-through" : ""}`}>{task.title}</h3>
          {task.description ? <p className="text-muted mt-1 text-sm">{task.description}</p> : null}
          <p className="text-muted mt-2 text-sm">Due {formatWhen(task.dueAt, timezone)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <form action={setTaskCompleted}>
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="completed" value={done ? "false" : "true"} />
            <button type="submit" className="btn-ghost">
              {done ? "Reopen" : "Mark done"}
            </button>
          </form>
          <button type="button" className="btn-ghost" onClick={() => setEditing((open) => !open)}>
            {editing ? "Close" : "Edit"}
          </button>
          <form action={deleteTask}>
            <input type="hidden" name="id" value={task.id} />
            <DeleteButton label="Delete task" />
          </form>
        </div>
      </div>
      {editing ? (
        <TaskForm
          action={updateTask}
          submitLabel="Save task"
          id={task.id}
          title={task.title}
          description={task.description ?? ""}
          dueAt={isoToDatetimeLocal(task.dueAt, timezone)}
        />
      ) : null}
    </div>
  );
}

export function TaskForm({
  action,
  submitLabel,
  id,
  title = "",
  description = "",
  dueAt = "",
  tags = "",
}: {
  action: (prev: TaskState, formData: FormData) => Promise<TaskState>;
  submitLabel: string;
  id?: string;
  title?: string;
  description?: string;
  dueAt?: string;
  tags?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="mt-4 grid gap-3">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <label className="grid gap-1 text-sm font-medium">
        Title
        <input name="title" required defaultValue={title} className="field" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Description
        <textarea name="description" defaultValue={description} rows={3} className="field" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Due
        <input name="dueAt" type="datetime-local" required defaultValue={dueAt} className="field" />
      </label>
      <label className="grid gap-1 text-sm font-medium">
        Tags
        <input
          name="tags"
          defaultValue={tags}
          placeholder="work urgent"
          aria-label="Tag words"
          className="field"
        />
      </label>
      <p className="text-muted text-xs">Separate tag words with spaces or commas.</p>
      {state.error ? <p className="text-danger text-sm">{state.error}</p> : null}
      <button type="submit" className="btn-primary w-fit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export function TimezoneCard({ timezone }: { timezone: string }) {
  const [state, formAction, pending] = useActionState(updateTimezone, {} as AuthState);
  const [value, setValue] = useState(timezone);

  return (
    <form action={formAction} className="border-line bg-card min-w-0 rounded-2xl border p-4">
      <h2 className="text-lg font-semibold">Reminder timezone</h2>
      <p className="text-muted mt-1 text-sm">
        The daily email groups overdue and due-today tasks in this timezone.
      </p>
      <label className="mt-4 grid gap-1 text-sm font-medium">
        Timezone
        <input
          name="timezone"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="field"
        />
      </label>
      {state.errors?.timezone ? <p className="text-danger mt-2 text-sm">{state.errors.timezone}</p> : null}
      {state.message ? <p className="text-accent mt-2 text-sm">{state.message}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Saving…" : "Save timezone"}
        </button>
        <button
          type="button"
          className="btn-ghost"
          onClick={() => setValue(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC")}
        >
          Use this device
        </button>
      </div>
    </form>
  );
}
