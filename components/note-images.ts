import type { EditorView } from "@tiptap/pm/view";

const MAX_EDGE = 1600;
const MAX_BYTES = 2_000_000;

export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
    throw new Error("Use a PNG, JPEG, GIF, or WebP image.");
  }
  if (file.size > 12_000_000) throw new Error("That image is too large.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not read that image.");
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const preferred = file.type === "image/png" || file.type === "image/webp" ? file.type : "image/jpeg";
  let blob = await canvasBlob(canvas, preferred, 0.85);
  if (!blob || blob.size > MAX_BYTES) blob = await canvasBlob(canvas, "image/jpeg", 0.8);
  if (!blob || blob.size > MAX_BYTES) throw new Error("That image is too large.");

  const extension = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
  const stem = file.name.replace(/\.[^.]+$/, "") || "image";
  return new File([blob], `${stem}.${extension}`, { type: blob.type });
}

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export function imageFiles(transfer: DataTransfer | null): File[] {
  if (!transfer) return [];
  const fromFiles = [...transfer.files].filter(isUploadableImage);
  if (fromFiles.length > 0) return fromFiles;
  return [...transfer.items]
    .filter((item) => item.kind === "file" && isUploadableType(item.type))
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}

export function imageFileList(list: FileList | null): File[] {
  return [...(list ?? [])].filter(isUploadableImage);
}

function isUploadableImage(file: File) {
  return isUploadableType(file.type);
}

function isUploadableType(type: string) {
  return type === "image/png" || type === "image/jpeg" || type === "image/gif" || type === "image/webp";
}

export async function uploadNoteImage(noteId: string, file: File): Promise<string> {
  const prepared = await prepareImage(file);
  const body = new FormData();
  body.set("noteId", noteId);
  body.set("file", prepared);
  const response = await fetch("/api/images", { method: "POST", body });
  const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!response.ok || !payload?.url) throw new Error(payload?.error ?? "Could not add that image.");
  return payload.url;
}

export async function insertUploadedImages(
  view: EditorView,
  noteId: string,
  files: File[],
  report: (status: string) => void,
) {
  if (files.length === 0) return;
  report("Uploading image…");
  try {
    for (const file of files) {
      const src = await uploadNoteImage(noteId, file);
      const node = view.state.schema.nodes.image?.create({ src, alt: "" });
      if (!node) throw new Error("Could not add that image.");
      view.dispatch(view.state.tr.replaceSelectionWith(node));
    }
  } catch (error) {
    report(error instanceof Error ? error.message : "Could not add that image.");
  }
}
