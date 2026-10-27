"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function NoteSearch({ query }: { query: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(query);

  return (
    <form
      className="note-search-wrap"
      onSubmit={(event) => {
        event.preventDefault();
        const params = new URLSearchParams(searchParams.toString());
        const trimmed = value.trim();
        if (trimmed) params.set("q", trimmed);
        else params.delete("q");
        const search = params.toString();
        router.push(search ? `${pathname}?${search}` : pathname);
      }}
    >
      <svg
        className="note-search-icon"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search notes"
        aria-label="Search notes"
        className="note-search-input"
      />
    </form>
  );
}
