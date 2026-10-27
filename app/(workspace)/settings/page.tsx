import { Suspense } from "react";
import { deleteCategory, listCategories } from "@/app/actions/notes";
import { DeleteButton } from "@/components/delete-button";
import { CategoryForm } from "@/components/category-controls";
import { TextSizeControl } from "@/components/text-size-control";
import { WorkspaceSplit } from "@/components/workspace-split";
import { requireUser } from "@/lib/auth";
import { noteFilters, type NoteSearchParams } from "@/lib/note-filters";

export const instant = false;

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<NoteSearchParams>;
}) {
  return (
    <Suspense fallback={<p className="text-muted">Loading settings…</p>}>
      <SettingsScreen searchParams={searchParams} />
    </Suspense>
  );
}

async function SettingsScreen({ searchParams }: { searchParams: Promise<NoteSearchParams> }) {
  const user = await requireUser();
  const { query, category } = noteFilters(await searchParams);
  const categories = await listCategories(user.id);

  return (
    <WorkspaceSplit query={query} category={category}>
      <div className="border-line bg-card grid min-w-0 gap-4 rounded-2xl border p-4 sm:p-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-muted mt-1 text-sm">
            Categories you add here show up in the note category menu.
          </p>
        </div>
        <section className="grid max-w-xl gap-3">
          <h2 className="text-lg font-semibold">Text size</h2>
          <p className="text-muted text-sm">This size is saved in this browser.</p>
          <TextSizeControl />
        </section>
        <section className="grid max-w-xl gap-3">
          <h2 className="text-lg font-semibold">Note categories</h2>
          <CategoryForm key={categories.length} />
          {categories.length === 0 ? (
            <p className="text-muted text-sm">No categories yet.</p>
          ) : (
            <ul className="grid gap-2">
              {categories.map((item) => (
                <li
                  key={item.id}
                  className="border-line flex min-w-0 items-center justify-between gap-3 rounded-xl border px-3 py-2"
                >
                  <span className="truncate text-sm font-medium">{item.name}</span>
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={item.id} />
                    <DeleteButton label={`Delete ${item.name}`} />
                  </form>
                </li>
              ))}
            </ul>
          )}
          <p className="text-muted text-xs">Deleting a category leaves its notes uncategorized.</p>
        </section>
      </div>
    </WorkspaceSplit>
  );
}
