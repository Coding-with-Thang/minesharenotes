export type NoteSearchParams = {
  q?: string | string[];
  category?: string | string[];
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
