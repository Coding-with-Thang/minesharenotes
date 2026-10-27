"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createCategory, setNoteCategory, type CategoryState } from "@/app/actions/notes";

export function CategoryForm() {
  const [state, action, pending] = useActionState(createCategory, {} as CategoryState);

  return (
    <form action={action} className="grid gap-1">
      <div className="flex gap-2">
        <input
          name="name"
          required
          maxLength={100}
          placeholder="New category"
          aria-label="New category"
          className="field"
        />
        <button type="submit" className="btn-ghost" disabled={pending}>
          {pending ? "Adding…" : "Add"}
        </button>
      </div>
      {state.error ? <p className="text-danger text-xs">{state.error}</p> : null}
    </form>
  );
}

export function CategoryPicker({
  noteId,
  categoryId,
  categories,
}: {
  noteId: string;
  categoryId: string | null;
  categories: { id: string; name: string }[];
}) {
  return (
    <form action={setNoteCategory} className="grid w-full min-w-0 gap-1 text-sm font-medium sm:max-w-xs">
      <input type="hidden" name="id" value={noteId} />
      <span>Category</span>
      <select
        name="categoryId"
        aria-label="Note category"
        className="field"
        defaultValue={categoryId ?? ""}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        <option value="">Uncategorized</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      {categories.length === 0 ? (
        <Link href="/settings" className="text-accent text-xs font-semibold">
          Add categories in Settings
        </Link>
      ) : null}
    </form>
  );
}
