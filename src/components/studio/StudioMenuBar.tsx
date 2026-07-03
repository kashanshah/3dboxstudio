"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { StudioFileModal } from "@/hooks/useStudioDocument";
import type { StudioHelpModal } from "./StudioHelpModals";
import { IconExternalLink } from "./StudioIcons";
import { BUYMEACOFFEE_URL, GITHUB_REPO_URL } from "@/siteMeta";

type OpenMenu = "file" | "help" | null;

type StudioMenuBarProps = {
  documentTitle: string;
  cloudBusy: boolean;
  onOpenModal: (modal: StudioFileModal) => void;
  onOpenHelpModal: (modal: StudioHelpModal) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onNew: () => void;
};

function useCloseOnOutsideClick(open: boolean, onClose: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open, onClose, ref]);
}

export default function StudioMenuBar({
  documentTitle,
  cloudBusy,
  onOpenModal,
  onOpenHelpModal,
  onSave,
  onSaveAs,
  onNew,
}: StudioMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const fileRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);

  useCloseOnOutsideClick(openMenu === "file", () => setOpenMenu(null), fileRef);
  useCloseOnOutsideClick(openMenu === "help", () => setOpenMenu(null), helpRef);

  const closeMenus = () => setOpenMenu(null);

  const pickFile = (action: () => void) => {
    closeMenus();
    action();
  };

  const pickHelp = (action: () => void) => {
    closeMenus();
    action();
  };

  return (
    <div className="studio-menu-bar">
      <div className="studio-menu-item" ref={fileRef}>
        <button
          type="button"
          className={`studio-menu-trigger${openMenu === "file" ? " is-open" : ""}`}
          aria-expanded={openMenu === "file"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "file" ? null : "file"))}
        >
          File
        </button>
        {openMenu === "file" && (
          <div className="studio-menu-dropdown" role="menu">
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(onNew)}>
              <span>New</span>
            </button>
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("open"))}>
              <span>Open…</span>
              <kbd>⌘O</kbd>
            </button>
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("recent"))}>
              <span>View Recent</span>
            </button>
            <div className="studio-menu-sep" role="separator" />
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              disabled={cloudBusy}
              onClick={() => pickFile(onSave)}
            >
              <span>{cloudBusy ? "Saving…" : "Save"}</span>
              <kbd>⌘S</kbd>
            </button>
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              disabled={cloudBusy}
              onClick={() => pickFile(onSaveAs)}
            >
              <span>Save As…</span>
              <kbd>⇧⌘S</kbd>
            </button>
            <div className="studio-menu-sep" role="separator" />
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("import"))}>
              <span>Import JSON…</span>
            </button>
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("export"))}>
              <span>Export JSON…</span>
            </button>
          </div>
        )}
      </div>

      <div className="studio-menu-item" ref={helpRef}>
        <button
          type="button"
          className={`studio-menu-trigger${openMenu === "help" ? " is-open" : ""}`}
          aria-expanded={openMenu === "help"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "help" ? null : "help"))}
        >
          Help
        </button>
        {openMenu === "help" && (
          <div className="studio-menu-dropdown" role="menu">
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              onClick={() => pickHelp(() => onOpenHelpModal("about"))}
            >
              <span>About 3D Box Studio</span>
            </button>
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              onClick={() => pickHelp(() => onOpenHelpModal("share-app"))}
            >
              <span>Share 3D Box Studio with friends</span>
            </button>
            <div className="studio-menu-sep" role="separator" />
            <a
              className="studio-menu-action studio-menu-action--link"
              role="menuitem"
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenus}
            >
              <span>View on GitHub</span>
              <IconExternalLink />
            </a>
            <a
              className="studio-menu-action studio-menu-action--link"
              role="menuitem"
              href={BUYMEACOFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenus}
            >
              <span>Buy me a coffee</span>
              <IconExternalLink />
            </a>
          </div>
        )}
      </div>

      <div className="studio-doc-title">{documentTitle}</div>
    </div>
  );
}
