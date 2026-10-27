import { withDb } from "@/src/prisma/db";
import { formatWhen, taskBucket, zonedDayRange } from "@/lib/time";
import { sendMail } from "@/lib/mail";

function taskLine(title: string, dueAt: string, tags: readonly string[], timezone: string) {
  const tagged = tags.length > 0 ? ` [${tags.join(" ")}]` : "";
  return `- ${title} (due ${formatWhen(dueAt, timezone)})${tagged}`;
}

export async function sendDueDigests(now = new Date()) {
  const users = await withDb((db) =>
    db.orm.public.User.select("id", "email", "name", "timezone").all(),
  );

  let sent = 0;
  for (const user of users) {
    const timezone = user.timezone || "UTC";
    const range = zonedDayRange(timezone, now);
    const tasks = await withDb((db) =>
      db.orm.public.Task.select("id", "title", "dueAt", "completedAt", "reminderSentAt", "tags")
        .where({ userId: user.id })
        .where((task) => task.completedAt.isNull())
        .where((task) => task.dueAt.lt(range.end.toISOString()))
        .orderBy((task) => task.dueAt.asc())
        .all(),
    );

    const pending = tasks.filter((task) => {
      if (!task.reminderSentAt) return true;
      return new Date(task.reminderSentAt).getTime() < range.start.getTime();
    });
    if (pending.length === 0) continue;

    const overdue = pending.filter((task) => taskBucket(task.dueAt, null, range) === "overdue");
    const today = pending.filter((task) => taskBucket(task.dueAt, null, range) === "today");
    const lines = [
      `Hello ${user.name},`,
      "",
      "Here are the tasks that need attention today.",
      "",
    ];
    if (overdue.length > 0) {
      lines.push("Overdue");
      for (const task of overdue) {
        lines.push(taskLine(task.title, task.dueAt, task.tags, timezone));
      }
      lines.push("");
    }
    if (today.length > 0) {
      lines.push("Due today");
      for (const task of today) {
        lines.push(taskLine(task.title, task.dueAt, task.tags, timezone));
      }
      lines.push("");
    }

    const subject = `Tasks due: ${overdue.length} overdue, ${today.length} due today`;
    await sendMail(user.email, subject, lines.join("\n"));

    const sentAt = new Date().toISOString();
    const ids = pending.map((task) => task.id);
    await withDb((db) =>
      db.orm.public.Task.where({ userId: user.id })
        .where((task) => task.id.in(ids))
        .updateAll({ reminderSentAt: sentAt }),
    );
    sent += 1;
  }

  return { users: users.length, sent };
}
