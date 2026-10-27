"use client";

import { useState } from "react";
import { deleteTask, setTaskCompleted, updateTask } from "@/app/actions/tasks";
import { DeleteButton } from "@/components/delete-button";
import { TaskForm } from "@/components/task-board";
import type { ReminderStatus } from "@/lib/time";

export function ReminderActions({
  id,
  title,
  description,
  dueAt,
  tags,
  status,
}: {
  id: string;
  title: string;
  description: string;
  dueAt: string;
  tags: string;
  status: ReminderStatus;
}) {
  const [editing, setEditing] = useState(false);
  const done = status === "completed";

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap gap-2">
        <form action={setTaskCompleted}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="completed" value={done ? "false" : "true"} />
          <button type="submit" className="btn-ghost">
            {done ? "Reopen" : "Mark done"}
          </button>
        </form>
        <button type="button" className="btn-ghost" onClick={() => setEditing((open) => !open)}>
          {editing ? "Close" : "Edit"}
        </button>
        <form action={deleteTask}>
          <input type="hidden" name="id" value={id} />
          <DeleteButton label="Delete reminder" />
        </form>
      </div>
      {editing ? (
        <TaskForm
          action={updateTask}
          submitLabel="Save reminder"
          id={id}
          title={title}
          description={description}
          dueAt={dueAt}
          tags={tags}
        />
      ) : null}
    </div>
  );
}
