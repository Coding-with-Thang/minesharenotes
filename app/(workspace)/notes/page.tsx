import { Suspense } from "react";
import { listCategories, listNotes } from "@/app/actions/notes";
import { NoteOverview } from "@/components/note-overview";
import { WorkspaceSplit } from "@/components/workspace-split";
import { requireUser } from "@/lib/auth";
import { noteFilters, type NoteSearchParams } from "@/lib/note-filters";

export const instant = false;

export default function NotesPage({
  searchParams,
}: {
  searchParams: Promise<NoteSearchParams>;
}) {
  return (
    <Suspense fallback={<p className="text-muted">Loading notes…</p>}>
      <NotesIndex searchParams={searchParams} />
    </Suspense>
  );
}

async function NotesIndex({ searchParams }: { searchParams: Promise<NoteSearchParams> }) {
  const user = await requireUser();
  const { query, category } = noteFilters(await searchParams);
  const [notes, categories] = await Promise.all([
    listNotes(user.id, query),
    listCategories(user.id),
  ]);

  return (
    <WorkspaceSplit query={query} category={category}>
      <NoteOverview categories={categories} notes={notes} query={query} category={category} />
    </WorkspaceSplit>
  );
}
