const HOUR_MS = 60 * 60 * 1000;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function zonedParts(timeZone: string, date: Date): ZonedParts {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(formatted.find((part) => part.type === type)?.value ?? "0");

  return {
    year: read("year"),
    month: read("month"),
    day: read("day"),
    hour: read("hour") % 24,
    minute: read("minute"),
    second: read("second"),
  };
}

function offsetMs(timeZone: string, date: Date): number {
  const part = zonedParts(timeZone, date);
  const asUtc = Date.UTC(
    part.year,
    part.month - 1,
    part.day,
    part.hour,
    part.minute,
    part.second,
  );
  return asUtc - date.getTime();
}

export function startOfZonedDay(timeZone: string, now: Date): Date {
  const part = zonedParts(timeZone, now);
  const utcMidnight = new Date(Date.UTC(part.year, part.month - 1, part.day));
  return new Date(utcMidnight.getTime() - offsetMs(timeZone, utcMidnight));
}

export function zonedDayRange(timeZone: string, now = new Date()) {
  const start = startOfZonedDay(timeZone, now);
  const end = startOfZonedDay(timeZone, new Date(start.getTime() + 36 * HOUR_MS));
  return { start, end };
}

export function zonedLocalToIso(local: string, timeZone: string): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const utc = new Date(guess.getTime() - offsetMs(timeZone, guess));
  if (Number.isNaN(utc.getTime())) return null;
  return utc.toISOString();
}

export function isoToDatetimeLocal(iso: string, timeZone: string): string {
  const part = zonedParts(timeZone, new Date(iso));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${part.year}-${pad(part.month)}-${pad(part.day)}T${pad(part.hour)}:${pad(part.minute)}`;
}

export function formatWhen(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export type ReminderStatus = "active" | "expired" | "completed";

export function reminderStatus(
  dueAt: string,
  completedAt: string | null,
  now: Date,
): ReminderStatus {
  if (completedAt) return "completed";
  if (new Date(dueAt).getTime() < now.getTime()) return "expired";
  return "active";
}

export type TaskBucket = "overdue" | "today" | "upcoming" | "done";

export function taskBucket(
  dueAt: string,
  completedAt: string | null,
  range: { start: Date; end: Date },
): TaskBucket {
  if (completedAt) return "done";
  const due = new Date(dueAt).getTime();
  if (due < range.start.getTime()) return "overdue";
  if (due < range.end.getTime()) return "today";
  return "upcoming";
}
