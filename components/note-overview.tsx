import Link from "next/link";
import { createNote } from "@/app/actions/notes";
import { CategoryGroup } from "@/components/category-group";
import { groupNotesByCategory, matchingCategory, withNoteFilters } from "@/lib/note-filters";

type Category = { id: string; name: string };
type Note = { id: string; title: string; updatedAt: string; categoryId: string | null; plainText: string };

const TONES = ["sand", "sky", "mint", "rose", "lilac"] as const;

function chipTone(id: string): (typeof TONES)[number] {
  let hash = 0;
  for (const char of id) hash = (hash + char.charCodeAt(0)) % TONES.length;
  return TONES[hash] ?? "sand";
}

function categoryLabel(name: string): string {
  const code = name.match(/^([A-Za-z]+-\d+)/);
  return code?.[1] ?? name;
}

function notePreview(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function NoteOverview({
  categories,
  notes,
  query,
  category,
}: {
  categories: Category[];
  notes: Note[];
  query: string;
  category: string;
}) {
  const selected = matchingCategory(category, categories);
  const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
  const visible = notes.filter((note) => {
    if (selected === "none") return !note.categoryId;
    if (selected) return note.categoryId === selected;
    return true;
  });
  const groups = groupNotesByCategory(visible, categories);

  return (
    <div className="note-board">
      <h1 className="note-board-title">Notes</h1>
      {query ? <p className="note-board-lead">Notes matching “{query}”.</p> : null}

      <div className="note-board-columns" aria-hidden="true">
        <span>Note</span>
        <span>Category</span>
      </div>

      {visible.length === 0 ? (
        <p className="note-board-empty">
          {query ? "No notes match that search." : selected ? "No notes in this category." : "No notes yet."}
        </p>
      ) : (
        <div className="category-groups category-groups-board">
          {groups.map((group) => (
            <CategoryGroup key={group.id} id={group.id} name={group.name} count={group.notes.length} variant="board">
              <ul className="note-board-list">
                {group.notes.map((note) => {
                  const categoryName = note.categoryId ? categoryMap.get(note.categoryId) : null;
                  const preview = notePreview(note.plainText);
                  return (
                    <li key={note.id}>
                      <Link href={withNoteFilters(`/notes/${note.id}`, query, selected)} className="note-row">
                        <span className="note-row-main">
                          <svg className="note-row-icon" width="15" height="15" viewBox="0 0 16 16" aria-hidden="true">
                            <path
                              d="M4 1.75h5.2L13 5.5V14.25H4V1.75Z"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.2"
                              strokeLinejoin="round"
                            />
                            <path d="M9 1.75V5.5h4" fill="none" stroke="currentColor" strokeWidth="1.2" />
                          </svg>
                          <span className="note-row-copy">
                            <span className="note-row-title">{note.title}</span>
                            {preview ? <span className="note-row-preview">{preview}</span> : null}
                          </span>
                        </span>
                        <span className="note-row-category">
                          {categoryName && note.categoryId ? (
                            <span className="note-chip" data-tone={chipTone(note.categoryId)} title={categoryName}>
                              {categoryLabel(categoryName)}
                            </span>
                          ) : (
                            <span className="note-row-uncategorized">—</span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </CategoryGroup>
          ))}
        </div>
      )}

      <form action={createNote}>
        {selected && selected !== "none" ? <input type="hidden" name="categoryId" value={selected} /> : null}
        <button type="submit" className="note-board-new">
          + New note
        </button>
      </form>
    </div>
  );
}
