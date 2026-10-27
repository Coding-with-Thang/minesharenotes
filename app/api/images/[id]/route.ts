import { requireUser } from "@/lib/auth";
import { withDb } from "@/src/prisma/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  if (!UUID.test(id)) return new Response("Not found", { status: 404 });

  const image = await withDb((db) =>
    db.orm.public.NoteImage.select("contentType", "data").where({ id, userId: user.id }).first(),
  );
  if (!image) return new Response("Not found", { status: 404 });

  const bytes = image.data instanceof Uint8Array ? image.data : new Uint8Array(image.data);
  const body = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(body).set(bytes);
  return new Response(body, {
    headers: {
      "Content-Type": image.contentType,
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, max-age=86400",
    },
  });
}
