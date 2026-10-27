import { requireUser } from "@/lib/auth";
import { imageByteLimit, imageMediaType } from "@/lib/images";
import { withDb } from "@/src/prisma/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  const user = await requireUser();
  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > imageByteLimit() + 100_000) {
    return Response.json({ error: "That image is too large." }, { status: 413 });
  }

  const form = await request.formData();
  const noteId = String(form.get("noteId") ?? "");
  const file = form.get("file");
  if (!UUID.test(noteId) || !(file instanceof File)) {
    return Response.json({ error: "Choose an image to add." }, { status: 400 });
  }
  if (file.size > imageByteLimit()) {
    return Response.json({ error: "That image is too large." }, { status: 413 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const contentType = imageMediaType(bytes);
  if (!contentType) {
    return Response.json({ error: "Use a PNG, JPEG, GIF, or WebP image." }, { status: 400 });
  }

  const image = await withDb(async (db) => {
    const note = await db.orm.public.Note.select("id").where({ id: noteId, userId: user.id }).first();
    if (!note) return null;
    return db.orm.public.NoteImage.select("id").create({
      userId: user.id,
      noteId,
      contentType,
      data: bytes,
    });
  });

  if (!image) return Response.json({ error: "This note is no longer available." }, { status: 404 });
  return Response.json({ url: `/api/images/${image.id}` });
}
