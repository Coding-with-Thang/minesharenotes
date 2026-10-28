export type NoteSearchParams = {
  q?: string | string[];
  category?: string | string[];
  edit?: string | string[];
};

export function noteFilters(params: NoteSearchParams) {
  const query = typeof params.q === "string" ? params.q : "";
  const requested = typeof params.category === "string" ? params.category : "";
  return { query, category: requested };
}

export function matchingCategory(category: string, categories: { id: string }[]) {
  if (category === "none") return "none";
  if (categories.some((item) => item.id === category)) return category;
  return "";
}

export function withNoteFilters(path: string, query: string, category: string) {
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category) params.set("category", category);
  const search = params.toString();
  return search ? `${path}?${search}` : path;
}

export function groupNotesByCategory<T extends { categoryId: string | null }>(
  notes: T[],
  categories: { id: string; name: string }[],
) {
  const byCategory = new Map(categories.map((category) => [category.id, [] as T[]]));
  const uncategorized: T[] = [];

  for (const note of notes) {
    const bucket = note.categoryId ? byCategory.get(note.categoryId) : undefined;
    if (bucket) bucket.push(note);
    else uncategorized.push(note);
  }

  const groups = categories.flatMap((category) => {
    const items = byCategory.get(category.id) ?? [];
    return items.length ? [{ id: category.id, name: category.name, notes: items }] : [];
  });

  if (uncategorized.length) {
    groups.push({ id: "none", name: "Uncategorized", notes: uncategorized });
  }

  return groups;
}
