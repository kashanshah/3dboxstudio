"use client";

import { Link } from "@/i18n/routing";
import { useEffect, useRef, useState, type RefObject } from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import type { StudioFileModal } from "@/hooks/useStudioDocument";
import type { StudioHelpModal } from "./StudioHelpModals";
import { IconExternalLink, IconRename } from "./StudioIcons";
import { BUYMEACOFFEE_URL } from "@/siteMeta";
import type { AuthUser } from "@/lib/authTypes";
import type { StudioThemePreference } from "@/lib/studioTheme";
import { useTranslations } from "next-intl";

type OpenMenu = "brand" | "file" | "view" | "help" | "account" | null;

type StudioMenuBarProps = {
  documentTitle: string;
  cloudBusy: boolean;
  viewOnly: boolean;
  canRename: boolean;
  canSaveCopy: boolean;
  canSharePreview: boolean;
  sidebarOpen: boolean;
  authLoading: boolean;
  user: AuthUser | null;
  /** Sign-in gate: brand, help, and account only (no file/view/title chrome). */
  authGate?: boolean;
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
  themePreference: StudioThemePreference;
  onSetThemePreference: (preference: StudioThemePreference) => void;
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
  authLoading,
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
  themePreference,
  onSetThemePreference,
  authGate = false,
}: StudioMenuBarProps) {
  const t = useTranslations("studio.menu");
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
            width={24}
            height={24}
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
              <span>{t("home")}</span>
            </Link>
            <div className="studio-menu-sep" role="separator" />
            <a
              className="studio-menu-action studio-menu-action--link"
              role="menuitem"
              href={BUYMEACOFFEE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMenus}
            >
              <span>{t("buyMeACoffee")}</span>
              <IconExternalLink />
            </a>
          </div>
        )}
      </div>

      {!authGate && (
      <div className="studio-menu-item" ref={fileRef}>
        <button
          type="button"
          className={`studio-menu-trigger${openMenu === "file" ? " is-open" : ""}`}
          aria-expanded={openMenu === "file"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "file" ? null : "file"))}
        >
          {t("file")}
        </button>
        {openMenu === "file" && (
          <div className="studio-menu-dropdown" role="menu">
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(onNew)}>
              <span>{t("newDesign")}</span>
            </button>
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("open"))}>
              <span>{t("open")}</span>
              <kbd>⌘O</kbd>
            </button>
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("recent"))}>
              <span>{t("viewRecent")}</span>
            </button>
            <div className="studio-menu-sep" role="separator" />
            {!viewOnly && (
              <button
                type="button"
                className="studio-menu-action"
                role="menuitem"
                disabled={cloudBusy || authLoading}
                onClick={() => pickFile(onSave)}
              >
                <span>{cloudBusy ? t("saving") : t("save")}</span>
                <kbd>⌘S</kbd>
              </button>
            )}
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              disabled={cloudBusy || authLoading}
              onClick={() => pickFile(onSaveAs)}
            >
              <span>{t("saveAs")}</span>
              {!viewOnly && <kbd>⇧⌘S</kbd>}
            </button>
            {!viewOnly && (
              <>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  disabled={cloudBusy || !canSaveCopy}
                  onClick={() => pickFile(onSaveCopy)}
                >
                  <span>{t("saveCopy")}</span>
                </button>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  disabled={cloudBusy || !canRename}
                  onClick={() => pickFile(onRename)}
                >
                  <span>{t("rename")}</span>
                </button>
                <div className="studio-menu-sep" role="separator" />
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  disabled={!canSharePreview}
                  onClick={() => pickFile(onSharePreview)}
                >
                  <span>{t("sharePreview")}</span>
                </button>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  disabled={!canSharePreview}
                  onClick={() => pickFile(onCopyPreviewLink)}
                >
                  <span>{t("copyPreview")}</span>
                </button>
                <div className="studio-menu-sep" role="separator" />
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("import"))}>
                  <span>{t("importJson")}</span>
                </button>
              </>
            )}
            <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickFile(() => onOpenModal("export"))}>
              <span>{t("exportJson")}</span>
            </button>
          </div>
        )}
      </div>
      )}

      {!authGate && (
      <div className="studio-menu-item" ref={viewRef}>
        <button
          type="button"
          className={`studio-menu-trigger${openMenu === "view" ? " is-open" : ""}`}
          aria-expanded={openMenu === "view"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "view" ? null : "view"))}
        >
          {t("view")}
        </button>
        {openMenu === "view" && (
          <div className="studio-menu-dropdown" role="menu">
            <div className="studio-menu-submenu">
              <button
                type="button"
                className="studio-menu-action studio-menu-submenu-trigger"
                aria-haspopup="menu"
              >
                <span>{t("toolbars")}</span>
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
                  <span>{t("configurationPanel")}</span>
                </button>
              </div>
            </div>
            <div className="studio-menu-sep" role="separator" />
            <button
              type="button"
              className="studio-menu-action studio-menu-check-item"
              role="menuitemcheckbox"
              aria-checked={themePreference === "system"}
              onClick={() => pickView(() => onSetThemePreference("system"))}
            >
              <span className="studio-menu-check" aria-hidden>
                {themePreference === "system" ? "✓" : ""}
              </span>
              <span>{t("systemTheme")}</span>
            </button>
            <button
              type="button"
              className="studio-menu-action studio-menu-check-item"
              role="menuitemcheckbox"
              aria-checked={themePreference === "dark"}
              onClick={() => pickView(() => onSetThemePreference("dark"))}
            >
              <span className="studio-menu-check" aria-hidden>
                {themePreference === "dark" ? "✓" : ""}
              </span>
              <span>{t("darkTheme")}</span>
            </button>
            <button
              type="button"
              className="studio-menu-action studio-menu-check-item"
              role="menuitemcheckbox"
              aria-checked={themePreference === "light"}
              onClick={() => pickView(() => onSetThemePreference("light"))}
            >
              <span className="studio-menu-check" aria-hidden>
                {themePreference === "light" ? "✓" : ""}
              </span>
              <span>{t("lightTheme")}</span>
            </button>
          </div>
        )}
      </div>
      )}

      {!authGate && viewOnly && <span className="studio-menu-preview-badge">{t("viewOnly")}</span>}

      <div className="studio-menu-item" ref={helpRef}>
        <button
          type="button"
          className={`studio-menu-trigger${openMenu === "help" ? " is-open" : ""}`}
          aria-expanded={openMenu === "help"}
          aria-haspopup="menu"
          onClick={() => setOpenMenu((m) => (m === "help" ? null : "help"))}
        >
          {t("help")}
        </button>
        {openMenu === "help" && (
          <div className="studio-menu-dropdown" role="menu">
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              onClick={() => pickHelp(() => onOpenHelpModal("about"))}
            >
              <span>{t("about")}</span>
            </button>
            <button
              type="button"
              className="studio-menu-action"
              role="menuitem"
              onClick={() => pickHelp(() => onOpenHelpModal("share-app"))}
            >
              <span>{t("shareWithFriends")}</span>
            </button>
            <div className="studio-menu-sep" role="separator" />
            <Link
              className="studio-menu-action studio-menu-action--link"
              role="menuitem"
              href="/contact"
              onClick={closeMenus}
            >
              <span>{t("contact")}</span>
            </Link>
          </div>
        )}
      </div>

      {!authGate && (
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
            aria-label={t("renameDesign")}
            title={t("renameDesign")}
          >
            <IconRename />
          </button>
        )}
      </div>
      )}

      {authGate ? <div className="studio-menu-auth-gate-spacer" aria-hidden /> : null}

      <div className="studio-menu-locale">
        <LanguageSwitcher className="language-switcher--studio" />
      </div>

      <div className="studio-menu-item studio-menu-account-item" ref={accountRef}>
        {authLoading ? (
          <span className="studio-menu-trigger studio-menu-account-trigger studio-menu-account-loading" aria-busy="true">
            {t("accountLoading")}
          </span>
        ) : user ? (
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
                  <span className="studio-menu-account-name">{user.name || t("signedIn")}</span>
                  <span className="studio-menu-account-email">{user.email}</span>
                  {!user.emailVerified && <span className="studio-menu-account-unverified">{t("emailNotVerified")}</span>}
                </div>
                <div className="studio-menu-sep" role="separator" />
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onOpenProjects)}>
                  <span>{t("myProjects")}</span>
                </button>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  onClick={() => pickAccount(() => onOpenAccountSettings("account"))}
                >
                  <span>{t("accountSettings")}</span>
                </button>
                <button
                  type="button"
                  className="studio-menu-action"
                  role="menuitem"
                  onClick={() => pickAccount(() => onOpenAccountSettings("profile"))}
                >
                  <span>{t("profileSettings")}</span>
                </button>
                <div className="studio-menu-sep" role="separator" />
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onSignOut)}>
                  <span>{t("signOut")}</span>
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
              {t("signIn")}
            </button>
            {openMenu === "account" && (
              <div className="studio-menu-dropdown studio-menu-dropdown--right" role="menu">
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onSignIn)}>
                  <span>{t("signIn")}</span>
                </button>
                <button type="button" className="studio-menu-action" role="menuitem" onClick={() => pickAccount(onSignUp)}>
                  <span>{t("createAccount")}</span>
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
