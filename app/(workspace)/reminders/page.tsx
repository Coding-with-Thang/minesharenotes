import { Suspense } from "react";
import { createTask, listTasks } from "@/app/actions/tasks";
import { ReminderLists } from "@/components/reminder-lists";
import { TaskForm, TimezoneCard } from "@/components/task-board";
import { WorkspaceSplit } from "@/components/workspace-split";
import { requireUser } from "@/lib/auth";
import { noteFilters, type NoteSearchParams } from "@/lib/note-filters";

export const instant = false;

export default function RemindersPage({
  searchParams,
}: {
  searchParams: Promise<NoteSearchParams>;
}) {
  return (
    <Suspense fallback={<p className="text-muted">Loading reminders…</p>}>
      <RemindersScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function RemindersScreen({ searchParams }: { searchParams: Promise<NoteSearchParams> }) {
  const user = await requireUser();
  const { query, category } = noteFilters(await searchParams);
  const now = new Date();
  const tasks = await listTasks(user.id);

  return (
    <WorkspaceSplit query={query} category={category}>
      <div className="grid gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">All reminders</h1>
          <p className="text-muted mt-1 text-sm">
            Active reminders are still ahead. Completed and expired reminders stay in the list below.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
          <div className="border-line bg-card min-w-0 rounded-2xl border p-4">
            <h2 className="text-lg font-semibold">Add a reminder</h2>
            <p className="text-muted mt-1 text-sm">Due times use {user.timezone}.</p>
            <TaskForm action={createTask} submitLabel="Add reminder" />
          </div>
          <TimezoneCard timezone={user.timezone} />
        </div>
        <ReminderLists tasks={tasks} now={now} timezone={user.timezone} query={query} category={category} />
      </div>
    </WorkspaceSplit>
  );
}
