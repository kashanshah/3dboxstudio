"use client";

import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/react";
import { useEffect, useMemo } from "react";

type AdminRichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type ToolbarAction =
  | { label: string; command: "paragraph" | "heading2" | "heading3" | "bold" | "italic" | "bulletList" | "orderedList" }
  | { label: string; command: "createLink" };

const TOOLBAR: ToolbarAction[] = [
  { label: "P", command: "paragraph" },
  { label: "H2", command: "heading2" },
  { label: "H3", command: "heading3" },
  { label: "Bold", command: "bold" },
  { label: "Italic", command: "italic" },
  { label: "Bullets", command: "bulletList" },
  { label: "Numbers", command: "orderedList" },
  { label: "Link", command: "createLink" },
];

export default function AdminRichTextEditor({
  id,
  label,
  value,
  onChange,
  placeholder = "Write your reply...",
}: AdminRichTextEditorProps) {
  const labelId = useMemo(() => `${id}-label`, [id]);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    immediatelyRender: false,
    content: value,
    editorProps: {
      attributes: {
        id,
        class: "admin-rich-editor-input",
        "aria-labelledby": labelId,
        "aria-multiline": "true",
        role: "textbox",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (current === value) return;
    editor.commands.setContent(value, { emitUpdate: false });
  }, [editor, value]);

  function applyAction(action: ToolbarAction) {
    if (!editor) return;
    if (action.command === "createLink") {
      const previousHref = editor.getAttributes("link").href as string | undefined;
      const href = window.prompt("Enter link URL", previousHref ?? "https://");
      if (href === null) return;
      const trimmed = href.trim();
      if (!trimmed) {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
        return;
      }
      editor.chain().focus().extendMarkRange("link").setLink({ href: trimmed }).run();
      return;
    }

    const chain = editor.chain().focus();
    switch (action.command) {
      case "paragraph":
        chain.setParagraph().run();
        break;
      case "heading2":
        chain.toggleHeading({ level: 2 }).run();
        break;
      case "heading3":
        chain.toggleHeading({ level: 3 }).run();
        break;
      case "bold":
        chain.toggleBold().run();
        break;
      case "italic":
        chain.toggleItalic().run();
        break;
      case "bulletList":
        chain.toggleBulletList().run();
        break;
      case "orderedList":
        chain.toggleOrderedList().run();
        break;
    }
  }

  function isActive(action: ToolbarAction): boolean {
    if (!editor || action.command === "createLink") return false;
    switch (action.command) {
      case "paragraph":
        return editor.isActive("paragraph");
      case "heading2":
        return editor.isActive("heading", { level: 2 });
      case "heading3":
        return editor.isActive("heading", { level: 3 });
      case "bold":
        return editor.isActive("bold");
      case "italic":
        return editor.isActive("italic");
      case "bulletList":
        return editor.isActive("bulletList");
      case "orderedList":
        return editor.isActive("orderedList");
    }
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor-toolbar" role="toolbar" aria-labelledby={labelId}>
        {TOOLBAR.map((action) => (
          <button
            key={action.label}
            type="button"
            className={`admin-rich-editor-tool${isActive(action) ? " is-active" : ""}`}
            onClick={() => applyAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
      <label className="admin-rich-editor-field">
        <span id={labelId} className="admin-rich-editor-label">
          {label}
        </span>
        <EditorContent editor={editor} />
      </label>
    </div>
  );
}
