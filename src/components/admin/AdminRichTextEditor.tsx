"use client";

import { useEffect, useMemo, useRef } from "react";

type AdminRichTextEditorProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

type ToolbarAction =
  | { label: string; command: "bold" | "italic" | "insertUnorderedList" | "insertOrderedList" | "removeFormat" }
  | { label: string; command: "formatBlock"; value: string }
  | { label: string; command: "createLink" };

const TOOLBAR: ToolbarAction[] = [
  { label: "P", command: "formatBlock", value: "p" },
  { label: "H2", command: "formatBlock", value: "h2" },
  { label: "H3", command: "formatBlock", value: "h3" },
  { label: "Bold", command: "bold" },
  { label: "Italic", command: "italic" },
  { label: "Bullets", command: "insertUnorderedList" },
  { label: "Numbers", command: "insertOrderedList" },
  { label: "Link", command: "createLink" },
  { label: "Clear", command: "removeFormat" },
];

export default function AdminRichTextEditor({
  id,
  label,
  value,
  onChange,
  placeholder = "Write your reply...",
}: AdminRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const labelId = useMemo(() => `${id}-label`, [id]);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value;
  }, [value]);

  function syncFromEditor() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function applyAction(action: ToolbarAction) {
    editorRef.current?.focus();
    if (action.command === "createLink") {
      const href = window.prompt("Enter link URL", "https://");
      if (!href) return;
      document.execCommand("createLink", false, href.trim());
      syncFromEditor();
      return;
    }
    if (action.command === "formatBlock") {
      document.execCommand("formatBlock", false, action.value);
      syncFromEditor();
      return;
    }
    document.execCommand(action.command, false);
    syncFromEditor();
  }

  return (
    <div className="admin-rich-editor">
      <div className="admin-rich-editor-toolbar" role="toolbar" aria-labelledby={labelId}>
        {TOOLBAR.map((action) => (
          <button
            key={action.label}
            type="button"
            className="admin-rich-editor-tool"
            onMouseDown={(event) => event.preventDefault()}
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
        <div
          id={id}
          ref={editorRef}
          className="admin-rich-editor-input"
          contentEditable
          suppressContentEditableWarning
          data-placeholder={placeholder}
          role="textbox"
          aria-labelledby={labelId}
          aria-multiline="true"
          onInput={syncFromEditor}
        />
      </label>
    </div>
  );
}
