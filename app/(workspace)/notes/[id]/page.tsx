import { notFound } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { deleteNote, listCategories } from "@/app/actions/notes";
import { DeleteButton } from "@/components/delete-button";
import { NoteEditor } from "@/components/note-editor";
import { WorkspaceSplit } from "@/components/workspace-split";
import { requireUser } from "@/lib/auth";
import { noteFilters, type NoteSearchParams } from "@/lib/note-filters";
import { EMPTY_NOTE, type NoteContent } from "@/lib/validators";
import { withDb } from "@/src/prisma/db";

export const instant = false;

type NoteRoute = {
  params: Promise<{ id: string }>;
  searchParams: Promise<NoteSearchParams>;
};

export default function NotePage(props: NoteRoute) {
  return (
    <Suspense fallback={<p className="text-muted">Loading note…</p>}>
      <NoteScreen {...props} />
    </Suspense>
  );
}

async function NoteScreen({ params, searchParams }: NoteRoute) {
  const user = await requireUser();
  const { id } = await params;
  const { query, category } = noteFilters(await searchParams);
  const [note, categories] = await Promise.all([
    withDb((db) =>
      db.orm.public.Note.select("id", "title", "content", "updatedAt", "categoryId", "createdAt")
        .where({ id, userId: user.id })
        .first(),
    ),
    listCategories(user.id),
  ]);

  if (!note) notFound();

  const categoryName = note.categoryId
    ? categories.find((c) => c.id === note.categoryId)?.name
    : null;

  const createdAt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(note.createdAt));

  return (
    <WorkspaceSplit query={query} category={category} activeNoteId={note.id}>
      <div className="note-detail">
        {/* Breadcrumb + actions */}
        <div className="note-detail-topbar">
          <nav className="note-breadcrumb">
            <Link href={`/notes?${category ? `category=${encodeURIComponent(category)}` : ""}`} className="note-breadcrumb-link">
              Notes
            </Link>
            <span className="note-breadcrumb-sep">/</span>
            <span className="note-breadcrumb-current">{note.title}</span>
          </nav>
          <div className="note-detail-actions">
            <button type="button" className="note-action-icon" aria-label="Bookmark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button type="button" className="note-action-icon" aria-label="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <button type="button" id={`edit-toggle-${note.id}`} className="note-edit-btn" aria-pressed="false">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Edit
            </button>
          </div>
        </div>

        {/* Note meta */}
        <div className="note-detail-meta">
          {categoryName && (
            <span className="note-detail-category-badge">{categoryName}</span>
          )}
          <span className="note-detail-created">Created {createdAt}</span>
        </div>

        {/* Title */}
        <h1 className="note-detail-title">{note.title}</h1>
        <hr className="note-detail-divider" />

        {/* Editor */}
        <NoteEditor
          id={note.id}
          initialTitle={note.title}
          initialContent={toNoteContent(note.content)}
          initialUpdatedAt={note.updatedAt}
          categories={categories}
          categoryId={note.categoryId}
          editToggleId={`edit-toggle-${note.id}`}
        />

        {/* Footer */}
        <div className="note-detail-footer">
          <p className="note-footer-tip">
            Tip: Press{" "}
            <kbd className="note-kbd">⌘</kbd>
            {" + "}
            <kbd className="note-kbd">N</kbd>
            {" "}anywhere to start a new note.
          </p>
          <form action={deleteNote} style={{ display: "inline" }}>
            <input type="hidden" name="id" value={note.id} />
            <button type="submit" className="note-restore-link">
              Restore previous revisions
            </button>
          </form>
        </div>
      </div>
    </WorkspaceSplit>
  );
}

function toNoteContent(value: unknown): NoteContent {
  if (value && typeof value === "object" && !Array.isArray(value) && "type" in value) {
    if ((value as { type?: unknown }).type === "doc") return value as NoteContent;
  }
  return EMPTY_NOTE;
}
