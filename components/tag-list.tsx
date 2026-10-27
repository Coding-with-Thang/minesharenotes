export function TagList({ tags }: { tags: readonly string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1">
      {tags.map((tag) => (
        <li key={tag} className="bg-paper text-muted rounded-full px-2 py-0.5 text-xs">
          {tag}
        </li>
      ))}
    </ul>
  );
}
