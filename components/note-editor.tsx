"use client";

import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { saveNote } from "@/app/actions/notes";
import { imageFileList, imageFiles, insertUploadedImages } from "@/components/note-images";
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
}: {
  id: string;
  initialTitle: string;
  initialContent: NoteContent;
  initialUpdatedAt: string;
  categories?: { id: string; name: string }[];
  categoryId?: string | null;
  editToggleId?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState("Saved");
  const [updatedAt, setUpdatedAt] = useState(initialUpdatedAt);
  const titleRef = useRef(initialTitle);
  const fileInput = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSeq = useRef(0);

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
    onUpdate: ({ editor: current }) => {
      queueSave(current.getJSON() as NoteContent, current.getText());
    },
  });

  // Sync editable state when isEditing changes
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [editor, isEditing]);

  // Listen for the label click (edit toggle)
  useEffect(() => {
    if (!editToggleId) return;
    const el = document.getElementById(editToggleId);
    if (!el) return;
    const handler = () => {
      setIsEditing((value) => {
        const next = !value;
        el.setAttribute("aria-pressed", String(next));
        return next;
      });
    };
    el.addEventListener("click", handler);
    return () => el.removeEventListener("click", handler);
  }, [editToggleId]);

  function queueSave(content: NoteContent, plainText: string) {
    if (timer.current) clearTimeout(timer.current);
    setStatus("Unsaved");
    timer.current = setTimeout(() => {
      void persist(content, plainText);
    }, 700);
  }

  async function persist(content: NoteContent, plainText: string) {
    const seq = ++saveSeq.current;
    setStatus("Saving…");
    const result = await saveNote({
      id,
      title: titleRef.current,
      content: JSON.stringify(content),
      plainText,
    });
    if (seq !== saveSeq.current) return;
    if (result.error) {
      setStatus(result.error);
      return;
    }
    if (result.updatedAt) setUpdatedAt(result.updatedAt);
    setStatus("Saved");
  }

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  return (
    <div className="note-editor-wrap">
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
              {status}
              {updatedAt ? ` · ${new Date(updatedAt).toLocaleString()}` : ""}
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
