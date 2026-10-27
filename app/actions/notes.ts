"use server";

import { cache } from "react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { withDb } from "@/src/prisma/db";
import {
  categoryName,
  clipPlainText,
  EMPTY_NOTE,
  ilikeContains,
  noteTitle,
  parseNoteContent,
  readText,
} from "@/lib/validators";
import { or } from "@prisma/orm-postgres/orm-client";

export type CategoryState = {
  error?: string;
};

function revalidateNotes() {
  revalidatePath("/notes");
  revalidatePath("/notes/[id]", "page");
  revalidatePath("/reminders");
  revalidatePath("/reminders/[id]", "page");
  revalidatePath("/settings");
}

export async function createNote(formData: FormData) {
  const user = await requireUser();
  const requested = readText(formData.get("categoryId"));
  const category = requested
    ? await withDb((db) =>
        db.orm.public.Category.select("id")
          .where({ id: requested, userId: user.id })
          .first(),
      )
    : null;
  const note = await withDb((db) =>
    db.orm.public.Note.select("id").create({
      userId: user.id,
      categoryId: category?.id ?? null,
      title: "Untitled",
      content: JSON.parse(JSON.stringify(EMPTY_NOTE)),
      plainText: "",
    }),
  );
  redirect(category?.id ? `/notes/${note.id}?category=${encodeURIComponent(category.id)}` : `/notes/${note.id}`);
}

export async function createCategory(
  _prev: CategoryState,
  formData: FormData,
): Promise<CategoryState> {
  const user = await requireUser();
  const name = categoryName(readText(formData.get("name")));
  if (!name) return { error: "Category names must be 1 to 100 characters." };

  const existing = await listCategories(user.id);
  if (existing.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
    return { error: "You already have a category with that name." };
  }

  await withDb((db) =>
    db.orm.public.Category.create({
      userId: user.id,
      name,
    }),
  );
  revalidateNotes();
  return {};
}

export async function deleteCategory(formData: FormData) {
  const user = await requireUser();
  const id = readText(formData.get("id"));
  if (!id) return;
  await withDb((db) => db.orm.public.Category.where({ id, userId: user.id }).delete());
  revalidateNotes();
}

export async function setNoteCategory(formData: FormData) {
  const user = await requireUser();
  const id = readText(formData.get("id"));
  const requested = readText(formData.get("categoryId"));
  if (!id) return;

  const category = requested
    ? await withDb((db) =>
        db.orm.public.Category.select("id")
          .where({ id: requested, userId: user.id })
          .first(),
      )
    : null;
  if (requested && !category) return;

  await withDb((db) =>
    db.orm.public.Note.where({ id, userId: user.id }).update({
      categoryId: category?.id ?? null,
    }),
  );
  revalidateNotes();
}

export const listCategories = cache(async (userId: string) => {
  return withDb((db) =>
    db.orm.public.Category.select("id", "name")
      .where({ userId })
      .orderBy((category) => category.name.asc())
      .all(),
  );
});

export async function saveNote(input: {
  id: string;
  title: string;
  content: string;
  plainText: string;
}): Promise<{ error?: string; updatedAt?: string }> {
  const user = await requireUser();
  const content = parseNoteContent(input.content);
  if (!content) return { error: "That note is too large or is not valid text." };

  const updated = await withDb((db) =>
    db.orm.public.Note.where({ id: input.id, userId: user.id })
      .select("updatedAt")
      .update({
        title: noteTitle(input.title),
        content: JSON.parse(input.content),
        plainText: clipPlainText(input.plainText),
      }),
  );

  if (!updated) return { error: "This note is no longer available." };
  return { updatedAt: updated.updatedAt };
}

export async function deleteNote(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await withDb((db) => db.orm.public.Note.where({ id, userId: user.id }).delete());
  redirect("/notes");
}

export const listNotes = cache(async (userId: string, query: string) => {
  const trimmed = query.trim().slice(0, 200);
  return withDb(async (db) => {
    let notes = db.orm.public.Note.select("id", "title", "updatedAt", "categoryId", "plainText").where({ userId });
    if (trimmed) {
      const pattern = ilikeContains(trimmed);
      notes = notes.where((note) => or(note.title.ilike(pattern), note.plainText.ilike(pattern)));
    }
    return notes.orderBy((note) => note.updatedAt.desc()).all();
  });
});
