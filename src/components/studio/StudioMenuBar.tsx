"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { StudioFileModal } from "@/hooks/useStudioDocument";
import type { StudioHelpModal } from "./StudioHelpModals";
import { IconExternalLink, IconRename } from "./StudioIcons";
import { BUYMEACOFFEE_URL, GITHUB_REPO_URL } from "@/siteMeta";
import type { AuthUser } from "@/lib/authTypes";

type OpenMenu = "brand" | "file" | "view" | "help" | "account" | null;

type StudioMenuBarProps = {
  documentTitle: string;
  cloudBusy: boolean;
  viewOnly: boolean;
  canRename: boolean;
  canSaveCopy: boolean;
  canSharePreview: boolean;
  sidebarOpen: boolean;
  user: AuthUser | null;
  onOpenModal: (modal: StudioFileModal) => void;
  onOpenHelpModal: (modal: StudioHelpModal) => void;
  onSave: () => void;
  onSaveAs: () => void;
  onSaveCopy: () => void;
  onRename: () => void;
  onSharePreview: () => void;
  onCopyPreviewLink: () => void;
  onNew: () => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onSignOut: () => void;
  onOpenProjects: () => void;
  onToggleSidebar: () => void;
  onOpenAccountSettings: (tab?: "account" | "profile") => void;
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
  viewOnly,
  canRename,
  canSaveCopy,
  canSharePreview,
  user,
  onOpenModal,
  onOpenHelpModal,
  onSave,
  onSaveAs,
  onSaveCopy,
  onRename,
  onSharePreview,
  onCopyPreviewLink,
  onNew,
  onSignIn,
  onSignUp,
  onSignOut,
  onOpenProjects,
  sidebarOpen,
  onToggleSidebar,
  onOpenAccountSettings,
}: StudioMenuBarProps) {
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useCloseOnOutsideClick(openMenu === "brand", () => setOpenMenu(null), brandRef);
  useCloseOnOutsideClick(openMenu === "file", () => setOpenMenu(null), fileRef);
  useCloseOnOutsideClick(openMenu === "view", () => setOpenMenu(null), viewRef);
  useCloseOnOutsideClick(openMenu === "help", () => setOpenMenu(null), helpRef);
  useCloseOnOutsideClick(openMenu === "account", () => setOpenMenu(null), accountRef);

  const closeMenus = () => setOpenMenu(null);

  const pickFile = (action: () => void) => {
    closeMenus();
    action();
  };

  const pickHelp = (action: () => void) => {
    closeMenus();
    action();
  };

  const pickView = (action: () => void) => {
    closeMenus();
    action();
  };

  const pickAccount = (action: () => void) => {
    closeMenus();
    action();
  };

  const accountInitial = user ? (user.name?.trim()?.[0] ?? user.email[0] ?? "?").toUpperCase() : null;

  return (
    <div className="studio-menu-bar">
      <div className="studio-menu-item" ref={brandRef}>
        <button
          type="button"
          className={`studio-menu-trigger studio-menu-brand${openMenu === "brand" ? " is-open" : ""}`}
          aria-expanded={openMenu === "brand"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "brand" ? null : "brand"))}
        >
          <img
            className="studio-menu-brand-logo"
            src="/logo-mark.svg"
            width={18}
            height={18}
            alt=""
            decoding="async"
          />
          <span>3D Box Studio</span>
        </button>
        {openMenu === "brand" && (
          <div className="studio-menu-dropdown" role="menu">
            <Link
              className="studio-menu-action studio-menu-action--link"
              role="menuitem"
              href="/"
              onClick={closeMenus}
            >
              <span>Home</span>
            </Link>
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

      {!viewOnly && (
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
              <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(onOpenProjects)}>
                <span>My Projects…</span>
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
              <button
                type="button"
                className="studio-menu-action"
                role="menuitem"
                disabled={cloudBusy || !canSaveCopy}
                onClick={() => pickFile(onSaveCopy)}
              >
                <span>Save a Copy…</span>
              </button>
              <button
                type="button"
                className="studio-menu-action"
                role="menuitem"
                disabled={cloudBusy || !canRename}
                onClick={() => pickFile(onRename)}
              >
                <span>Rename…</span>
              </button>
              <div className="studio-menu-sep" role="separator" />
              <button
                type="button"
                className="studio-menu-action"
                role="menuitem"
                disabled={!canSharePreview}
                onClick={() => pickFile(onSharePreview)}
              >
                <span>Share Preview Link…</span>
              </button>
              <button
                type="button"
                className="studio-menu-action"
                role="menuitem"
                disabled={!canSharePreview}
                onClick={() => pickFile(onCopyPreviewLink)}
              >
                <span>Copy Preview Link</span>
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
      )}

      <div className="studio-menu-item" ref={viewRef}>
        <button
          type="button"
          className={`studio-menu-trigger${openMenu === "view" ? " is-open" : ""}`}
          aria-expanded={openMenu === "view"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "view" ? null : "view"))}
        >
          View
        </button>
        {openMenu === "view" && (
          <div className="studio-menu-dropdown" role="menu">
            <div className="studio-menu-submenu">
              <button
                type="button"
                className="studio-menu-action studio-menu-submenu-trigger"
                aria-haspopup="menu"
              >
                <span>Toolbars</span>
              </button>
              <div className="studio-menu-dropdown studio-menu-submenu-panel" role="menu">
                <button
                  type="button"
                  className="studio-menu-action studio-menu-check-item"
                  role="menuitemcheckbox"
                  aria-checked={sidebarOpen}
                  onClick={() => pickView(onToggleSidebar)}
                >
                  <span className="studio-menu-check" aria-hidden>
                    {sidebarOpen ? "✓" : ""}
                  </span>
                  <span>Configuration Panel</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {viewOnly && <span className="studio-menu-preview-badge">View-only preview</span>}

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
          </div>
        )}
      </div>

      <div className="studio-doc-title-wrap">
        <div className="studio-doc-title" title={documentTitle}>
          {documentTitle}
        </div>
        {!viewOnly && canRename && (
          <button
            type="button"
            className="studio-doc-rename-btn"
            onClick={onRename}
            disabled={cloudBusy}
            aria-label="Rename design"
            title="Rename design"
          >
            <IconRename />
          </button>
        )}
      </div>

      <div className="studio-menu-item studio-menu-account-item" ref={accountRef}>
        {user ? (
          <>
            <button
              type="button"
              className={`studio-menu-trigger studio-menu-account-trigger${openMenu === "account" ? " is-open" : ""}`}
              aria-expanded={openMenu === "account"}
              aria-haspopup="menu"
              onClick={() => setOpenMenu((m) => (m === "account" ? null : "account"))}
              title={user.email}
            >
              <span className="studio-account-avatar" aria-hidden>
                {accountInitial}
              </span>
            </button>
            {openMenu === "account" && (
              <div className="studio-menu-dropdown studio-menu-dropdown--right" role="menu">
                <div className="studio-menu-account-header">
                  <span className="studio-menu-account-name">{user.name || "Signed in"}</span>
                  <span className="studio-menu-account-email">{user.email}</span>
                  {!user.emailVerified && <span className="studio-menu-account-unverified">Email not verified</span>}
                </div>
                <div className="studio-menu-sep" role="separator" />
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onOpenProjects)}>
                  <span>My Projects…</span>
                </button>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  onClick={() => pickAccount(() => onOpenAccountSettings("account"))}
                >
                  <span>Account settings…</span>
                </button>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  onClick={() => pickAccount(() => onOpenAccountSettings("profile"))}
                >
                  <span>Profile settings…</span>
                </button>
                <div className="studio-menu-sep" role="separator" />
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onSignOut)}>
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <button
              type="button"
              className={`studio-menu-trigger studio-menu-account-trigger${openMenu === "account" ? " is-open" : ""}`}
              aria-expanded={openMenu === "account"}
              aria-haspopup="menu"
              onClick={() => setOpenMenu((m) => (m === "account" ? null : "account"))}
            >
              Sign in
            </button>
            {openMenu === "account" && (
              <div className="studio-menu-dropdown studio-menu-dropdown--right" role="menu">
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onSignIn)}>
                  <span>Sign in</span>
                </button>
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onSignUp)}>
                  <span>Create account</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
