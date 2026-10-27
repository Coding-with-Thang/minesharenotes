import { isValidTimeZone } from "@/lib/time";

export type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim().toLowerCase();
}

export function readText(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

export function validateSignup(input: {
  name: string;
  email: string;
  password: string;
  timezone: string;
}): FieldErrors {
  const errors: FieldErrors = {};
  if (input.name.length < 1 || input.name.length > 80) {
    errors.name = "Name must be 1 to 80 characters.";
  }
  if (!EMAIL_PATTERN.test(input.email) || input.email.length > 254) {
    errors.email = "Enter a valid email address.";
  }
  if (input.password.length < 8 || input.password.length > 200) {
    errors.password = "Password must be 8 to 200 characters.";
  }
  if (!isValidTimeZone(input.timezone)) {
    errors.timezone = "Choose a valid timezone.";
  }
  return errors;
}

export function validateLogin(input: { email: string; password: string }): FieldErrors {
  const errors: FieldErrors = {};
  if (!EMAIL_PATTERN.test(input.email)) {
    errors.email = "Enter a valid email address.";
  }
  if (input.password.length < 1 || input.password.length > 200) {
    errors.password = "Enter your password.";
  }
  return errors;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export type NoteContent = {
  type: "doc";
  content?: JsonValue[];
};

export const EMPTY_NOTE: NoteContent = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

const MAX_NOTE_JSON = 1_500_000;
const MAX_PLAIN_TEXT = 200_000;

export function parseNoteContent(raw: string): NoteContent | null {
  if (raw.length > MAX_NOTE_JSON) return null;
  try {
    const value = JSON.parse(raw) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) return null;
    if ((value as { type?: unknown }).type !== "doc") return null;
    return value as NoteContent;
  } catch {
    return null;
  }
}

export function clipPlainText(value: string): string {
  return value.replace(/\u0000/g, "").slice(0, MAX_PLAIN_TEXT);
}

const MAX_TAGS = 20;
const MAX_TAG_LENGTH = 32;

export function parseTags(value: string): string[] {
  const tags: string[] = [];
  const seen = new Set<string>();
  for (const part of value.split(/[\s,]+/)) {
    const tag = part.replace(/^#+/, "").trim().toLowerCase().slice(0, MAX_TAG_LENGTH);
    if (!tag || seen.has(tag)) continue;
    if (!/^[\p{L}\p{N}_-]+$/u.test(tag)) continue;
    seen.add(tag);
    tags.push(tag);
    if (tags.length >= MAX_TAGS) break;
  }
  return tags;
}

export function formatTags(tags: readonly string[]): string {
  return tags.join(" ");
}

export function categoryName(value: string): string | null {
  const name = value.replace(/\s+/g, " ").trim();
  if (name.length < 1 || name.length > 100) return null;
  return name;
}

export function noteTitle(value: string): string {
  const title = value.replace(/\s+/g, " ").trim();
  if (!title) return "Untitled";
  return title.slice(0, 200);
}

export function ilikeContains(value: string): string {
  const escaped = value.replace(/[\\%_]/g, (char) => `\\${char}`);
  return `%${escaped}%`;
}
