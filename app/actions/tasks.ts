"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { withDb } from "@/src/prisma/db";
import { zonedLocalToIso } from "@/lib/time";
import { parseTags, readText } from "@/lib/validators";

function revalidateReminders() {
  revalidatePath("/notes");
  revalidatePath("/notes/[id]", "page");
  revalidatePath("/reminders");
  revalidatePath("/reminders/[id]", "page");
  revalidatePath("/tasks");
}

export type TaskState = {
  error?: string;
};

function taskFields(formData: FormData, timezone: string) {
  const title = readText(formData.get("title")).slice(0, 200);
  const description = readText(formData.get("description")).slice(0, 5000);
  const dueLocal = readText(formData.get("dueAt"));
  const dueAt = zonedLocalToIso(dueLocal, timezone);
  const tags = parseTags(readText(formData.get("tags")));
  return { title, description, dueAt, tags };
}

export async function createTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const user = await requireUser();
  const fields = taskFields(formData, user.timezone);
  if (!fields.title) return { error: "Give the task a title." };
  if (!fields.dueAt) return { error: "Choose a due date and time." };

  const task = await withDb((db) =>
    db.orm.public.Task.select("id").create({
      userId: user.id,
      title: fields.title,
      description: fields.description || null,
      dueAt: fields.dueAt!,
      tags: fields.tags,
    }),
  );
  revalidateReminders();
  redirect(`/reminders/${task.id}`);
}

export async function updateTask(_prev: TaskState, formData: FormData): Promise<TaskState> {
  const user = await requireUser();
  const id = readText(formData.get("id"));
  const fields = taskFields(formData, user.timezone);
  if (!id) return { error: "Missing task." };
  if (!fields.title) return { error: "Give the task a title." };
  if (!fields.dueAt) return { error: "Choose a due date and time." };

  const updated = await withDb((db) =>
    db.orm.public.Task.where({ id, userId: user.id }).update({
      title: fields.title,
      description: fields.description || null,
      dueAt: fields.dueAt!,
      tags: fields.tags,
    }),
  );
  if (!updated) return { error: "That task is no longer available." };
  revalidateReminders();
  return {};
}

export async function setTaskCompleted(formData: FormData) {
  const user = await requireUser();
  const id = readText(formData.get("id"));
  const completed = formData.get("completed") === "true";
  if (!id) return;

  await withDb((db) =>
    db.orm.public.Task.where({ id, userId: user.id }).update({
      completedAt: completed ? new Date().toISOString() : null,
    }),
  );
  revalidateReminders();
}

export async function deleteTask(formData: FormData) {
  const user = await requireUser();
  const id = readText(formData.get("id"));
  if (!id) return;
  await withDb((db) => db.orm.public.Task.where({ id, userId: user.id }).delete());
  revalidateReminders();
  redirect("/reminders");
}

export async function listTasks(userId: string) {
  return withDb((db) =>
    db.orm.public.Task.select("id", "title", "description", "dueAt", "completedAt", "tags")
      .where({ userId })
      .orderBy((task) => task.dueAt.asc())
      .all(),
  );
}
