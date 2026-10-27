"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "mineshare-collapsed-note-categories";
const CHANGE_EVENT = "mineshare-collapsed-note-categories";

function subscribe(onStoreChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function collapsedIds(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

function isCollapsed(raw: string, id: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) && parsed.includes(id);
  } catch {
    return false;
  }
}

function toggleCollapsed(id: string) {
  let current: string[] = [];
  try {
    const parsed = JSON.parse(collapsedIds()) as unknown;
    if (Array.isArray(parsed)) current = parsed.filter((item) => typeof item === "string");
  } catch {
    current = [];
  }
  const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    return;
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function CategoryGroup({
  id,
  name,
  count,
  variant,
  children,
}: {
  id: string;
  name: string;
  count: number;
  variant: "sidebar" | "board";
  children: React.ReactNode;
}) {
  const raw = useSyncExternalStore(subscribe, collapsedIds, () => "[]");
  const collapsed = isCollapsed(raw, id);
  const panelId = `category-group-${variant}-${id}`;

  return (
    <section className={`category-group category-group-${variant}`}>
      <button
        type="button"
        className="category-group-toggle"
        aria-expanded={!collapsed}
        aria-controls={panelId}
        onClick={() => toggleCollapsed(id)}
      >
        <svg
          className={`category-group-chevron${collapsed ? "" : " is-open"}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          aria-hidden="true"
        >
          <path
            d="M4.2 2.2 8 6 4.2 9.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="category-group-name" title={name}>
          {name}
        </span>
        <span className="category-group-count">{count}</span>
      </button>
      {collapsed ? null : (
        <div id={panelId} className="category-group-body">
          {children}
        </div>
      )}
    </section>
  );
}
