"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { saveNote } from "@/app/actions/notes";
import { imageFileList, imageFiles, insertUploadedImages } from "@/components/note-images";
import { noteTitle } from "@/lib/validators";
import type { JSONContent } from "@tiptap/core";
import type { NoteContent } from "@/lib/validators";

export function NoteEditor({
  id,
  initialTitle,
  initialContent,
  initialUpdatedAt,
  categories = [],
  categoryId = null,
  editToggleId,
  startEditing = false,
}: {
  id: string;
  initialTitle: string;
  initialContent: NoteContent;
  initialUpdatedAt: string;
  categories?: { id: string; name: string }[];
  categoryId?: string | null;
  editToggleId?: string;
  startEditing?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(startEditing);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState("Saved");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const [showSavedAt, setShowSavedAt] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [actionSlot, setActionSlot] = useState<HTMLElement | null>(null);
  const titleRef = useRef(initialTitle);
  const savedTitle = useRef(initialTitle);
  const baseline = useRef<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const saveSeq = useRef(0);
  const editGen = useRef(0);
  const lastSeen = useRef<string | null>(null);
  const didFocus = useRef(false);
  const saveRef = useRef<() => void>(() => {});

  const editor = useEditor({
    immediatelyRender: false,
    editable: isEditing,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: { openOnClick: false, autolink: true },
      }),
      Image.configure({ allowBase64: false }),
      Placeholder.configure({ placeholder: "Write a note, or paste an image…" }),
    ],
    content: initialContent as JSONContent,
    editorProps: {
      attributes: {
        class: "note-editor",
        "aria-label": "Note",
      },
      handlePaste(view, event) {
        const images = imageFiles(event.clipboardData);
        if (images.length === 0) return false;
        event.preventDefault();
        void insertUploadedImages(view, id, images, setStatus);
        return true;
      },
      handleDrop(view, event) {
        const images = imageFiles(event.dataTransfer);
        if (images.length === 0) return false;
        event.preventDefault();
        void insertUploadedImages(view, id, images, setStatus);
        return true;
      },
    },
    onCreate: ({ editor: current }) => {
      baseline.current = JSON.stringify(current.getJSON());
    },
    onUpdate: ({ editor: current }) => {
      syncDirty(JSON.stringify(current.getJSON()));
    },
  });

  function syncDirty(contentJson: string | null) {
    const contentChanged =
      baseline.current !== null && contentJson !== null && contentJson !== baseline.current;
    const titleChanged = titleRef.current !== savedTitle.current;
    const changed = contentChanged || titleChanged;
    const signature = `${titleRef.current}\n${contentJson ?? ""}`;
    if (signature !== lastSeen.current) {
      lastSeen.current = signature;
      if (changed) editGen.current += 1;
    }
    setDirty(changed);
    setStatus((current) => (current === "Saving…" ? current : changed ? "Unsaved" : "Saved"));
  }

  function updateTitle(value: string) {
    titleRef.current = value;
    setTitle(value);
    const contentJson = editor ? JSON.stringify(editor.getJSON()) : baseline.current;
    syncDirty(contentJson);
  }

  async function save() {
    const current = editor;
    if (!current || !dirty || status === "Saving…") return;
    const gen = editGen.current;
    const seq = ++saveSeq.current;
    const titleAtSave = titleRef.current;
    const contentJson = JSON.stringify(current.getJSON());
    const plainText = current.getText();
    setStatus("Saving…");
    const result = await saveNote({
      id,
      title: titleAtSave,
      content: contentJson,
      plainText,
    });
    if (seq !== saveSeq.current) return;
    if (result.error) {
      setStatus(result.error);
      return;
    }
    const stored = noteTitle(titleAtSave);
    savedTitle.current = stored;
    baseline.current = contentJson;
    if (titleRef.current === titleAtSave) {
      titleRef.current = stored;
      setTitle(stored);
    }
    if (result.updatedAt) setUpdatedAt(result.updatedAt);
    const stillEditing = editGen.current !== gen || titleRef.current !== stored;
    setDirty(stillEditing);
    setStatus(stillEditing ? "Unsaved" : "Saved");
    router.refresh();
  }

  saveRef.current = () => {
    void save();
  };

  useEffect(() => {
    setActionSlot(document.getElementById(`note-actions-${id}`));
  }, [id]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(isEditing);
  }, [editor, isEditing]);

  useEffect(() => {
    if (!isEditing || !startEditing || didFocus.current) return;
    const input = titleInputRef.current;
    if (!input) return;
    didFocus.current = true;
    input.focus();
    input.select();
  }, [isEditing, startEditing]);

  useEffect(() => {
    if (!editToggleId) return;
    const el = document.getElementById(editToggleId);
    if (!el) return;
    el.setAttribute("aria-pressed", String(isEditing));
    const handler = () => setIsEditing((value) => !value);
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [editToggleId, isEditing]);

  useEffect(() => {
    if (!isEditing) return;
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        saveRef.current();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing]);

  useEffect(() => {
    if (!dirty) return;
    function onLeave(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  useEffect(() => {
    setShowSavedAt(true);
  }, []);

  const routineStatus = status === "Saved" || status === "Saving…" || status === "Unsaved";
  const saveButton = (
    <button
      type="button"
      className="note-save-btn"
      onClick={() => saveRef.current()}
      disabled={!dirty || status === "Saving…"}
      aria-live="polite"
    >
      {status === "Saving…" ? "Saving…" : dirty ? "Save" : "Saved"}
    </button>
  );

  return (
    <div className="note-editor-wrap">
      {isEditing ? (
        <input
          ref={titleInputRef}
          className="note-detail-title note-title-input"
          value={title}
          aria-label="Note title"
          placeholder="Untitled"
          onChange={(event) => updateTitle(event.target.value)}
        />
      ) : (
        <h1 className="note-detail-title">{title.trim() || "Untitled"}</h1>
      )}
      <hr className="note-detail-divider" />
      {isEditing && actionSlot ? createPortal(saveButton, actionSlot) : null}
      {isEditing && (
        <>
          <div className="note-editor-toolbar">
            <ToolbarButton label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} />
            <ToolbarButton label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} />
            <ToolbarButton
              label="Heading"
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            />
            <ToolbarButton
              label="List"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
            />
            <ToolbarButton
              label="Numbered"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            />
            <ToolbarButton
              label="Quote"
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            />
            <ToolbarButton label="Code" onClick={() => editor?.chain().focus().toggleCodeBlock().run()} />
            <ToolbarButton
              label="Link"
              onClick={() => {
                const previous = editor?.getAttributes("link").href as string | undefined;
                const next = window.prompt("Link URL", previous ?? "https://");
                if (next === null) return;
                if (next === "") {
                  editor?.chain().focus().unsetLink().run();
                  return;
                }
                editor?.chain().focus().setLink({ href: next }).run();
              }}
            />
            <ToolbarButton
              label="Image"
              onClick={() => fileInput.current?.click()}
            />
            <span className="note-save-status" aria-live="polite">
              {status === "Uploading image…" ? status : null}
              {!routineStatus ? status : null}
              {status === "Saved" && showSavedAt && updatedAt
                ? new Date(updatedAt).toLocaleString()
                : null}
            </span>
          </div>
          <input
            ref={fileInput}
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            hidden
            aria-label="Upload images"
            onChange={(event) => {
              const files = imageFileList(event.currentTarget.files);
              event.currentTarget.value = "";
              if (!editor) return;
              void insertUploadedImages(editor.view, id, files, setStatus);
            }}
          />
        </>
      )}
      <div className={`note-editor-content ${isEditing ? "note-editor-content-editing" : ""}`}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="btn-ghost" onClick={onClick}>
      {label}
    </button>
  );
}
