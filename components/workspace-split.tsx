import Link from "next/link";
import { createNote, listCategories, listNotes } from "@/app/actions/notes";
import { CategoryGroup } from "@/components/category-group";
import { CategoryMenu } from "@/components/category-menu";
import { NoteSearch } from "@/components/note-search";
import { requireUser } from "@/lib/auth";
import { groupNotesByCategory, matchingCategory, withNoteFilters } from "@/lib/note-filters";
import { formatWhen, reminderStatus } from "@/lib/time";
import { listTasks } from "@/app/actions/tasks";

function formatNoteTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(iso));
  }
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(new Date(iso));
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(iso));
}

export async function WorkspaceSplit({
  query,
  category = "",
  activeNoteId,
  activeReminderId,
  children,
}: {
  query: string;
  category?: string;
  activeNoteId?: string;
  activeReminderId?: string;
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const now = new Date();
  const [notes, tasks, categories] = await Promise.all([
    listNotes(user.id, query),
    listTasks(user.id),
    listCategories(user.id),
  ]);
  const active = tasks.filter(
    (task) => reminderStatus(task.dueAt, task.completedAt, now) === "active",
  );
  const selected = matchingCategory(category, categories);
  const visibleNotes = notes.filter((note) => {
    if (selected === "none") return !note.categoryId;
    if (selected) return note.categoryId === selected;
    return true;
  });
  const noteGroups = groupNotesByCategory(visibleNotes, categories);

  return (
    <div className="workspace-layout">
      {/* ── Left sidebar ── */}
      <aside className="workspace-sidebar">

        {/* ── Reminders panel ── */}
        <div className="sidebar-card reminders-panel">
          <div className="sidebar-card-header">
            <h2 className="sidebar-card-title">Reminders</h2>
            <span className="sidebar-badge">{active.length} active</span>
          </div>
          <ul className="reminder-cards">
            {active.length === 0 ? (
              <li className="sidebar-empty">No active reminders</li>
            ) : (
              active.map((task) => (
                <li key={task.id}>
                  <Link
                    href={withNoteFilters(`/reminders/${task.id}`, query, selected)}
                    className={`reminder-card-item ${task.id === activeReminderId ? "reminder-card-active" : ""}`}
                  >
                    <span className="reminder-circle" aria-hidden="true" />
                    <span className="reminder-card-body">
                      <span className="reminder-card-title">{task.title}</span>
                      <span className="reminder-card-due">
                        Due {formatWhen(task.dueAt, user.timezone)}
                      </span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
          <Link
            href={withNoteFilters("/reminders", query, selected)}
            className="sidebar-all-link"
          >
            All reminders <span aria-hidden="true">›</span>
          </Link>
        </div>

        {/* ── Notes panel ── */}
        <div className="notes-panel">
          <div className="notes-panel-header">
            <h2 className="sidebar-card-title">Notes</h2>
            <form action={createNote}>
              {selected && selected !== "none" ? (
                <input type="hidden" name="categoryId" value={selected} />
              ) : null}
              <button type="submit" className="new-note-btn">
                <span aria-hidden="true">+</span> New note
              </button>
            </form>
          </div>

          <NoteSearch key={query} query={query} />

          <CategoryMenu category={selected} query={query} categories={categories} />

          {visibleNotes.length === 0 ? (
            <p className="sidebar-empty">
              {query
                ? "No notes match that search."
                : selected
                  ? "No notes in this category."
                  : "No notes yet."}
            </p>
          ) : (
            <div className="category-groups">
              {noteGroups.map((group) => (
                <CategoryGroup
                  key={group.id}
                  id={group.id}
                  name={group.name}
                  count={group.notes.length}
                  variant="sidebar"
                >
                  <ul className="category-group-notes">
                    {group.notes.map((note) => (
                      <li key={note.id}>
                        <Link
                          href={withNoteFilters(`/notes/${note.id}`, query, selected)}
                          className={`note-card ${note.id === activeNoteId ? "note-card-active" : ""}`}
                        >
                          <div className="note-card-top">
                            <span className="note-card-title">{note.title}</span>
                            <span className="note-card-time">{formatNoteTime(note.updatedAt)}</span>
                          </div>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </CategoryGroup>
              ))}
            </div>
          )}
        </div>

        <div className="sidebar-statusbar">
          <span className="status-dot" aria-hidden="true" />
          <span>Synced locally</span>
          <span className="status-version">v2.4.8</span>
        </div>
      </aside>

      {/* ── Right content ── */}
      <section className="workspace-content">{children}</section>
    </div>
  );
}
