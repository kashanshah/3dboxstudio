"use client";

import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import StudioDialog from "./StudioDialog";
import StudioProjectsPanel from "./StudioProjectsPanel";
import type { useStudioDocument } from "@/hooks/useStudioDocument";
import type { AuthUser } from "@/lib/authTypes";
import { formatRecentTimestamp } from "@/lib/recentDesigns";
import { useTranslations } from "next-intl";

type StudioFileModalsProps = {
  doc: ReturnType<typeof useStudioDocument>;
  authUser: AuthUser | null;
  onSignIn: () => void;
};

export default function StudioFileModals({ doc, authUser, onSignIn }: StudioFileModalsProps) {
  const t = useTranslations("studio.files");
  const [dragOver, setDragOver] = useState(false);

  const onImportChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (file) void doc.importJsonFile(file);
    },
    [doc]
  );

  const onDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) void doc.importJsonFile(file);
    },
    [doc]
  );

  const copySaveAsLink = useCallback(async () => {
    if (!doc.saveAsLink) return;
    try {
      await navigator.clipboard.writeText(doc.saveAsLink);
      doc.showStatus(t("editorCopied"));
    } catch {
      doc.showStatus(t("copyFailed"));
    }
  }, [doc, t]);

  const copySaveAsPreviewLink = useCallback(async () => {
    const url = doc.saveAsPreviewLink ?? doc.getPreviewLink();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      doc.showStatus(t("previewCopied"));
    } catch {
      doc.showStatus(t("previewCopyFailed"));
    }
  }, [doc, t]);

  return (
    <>
      <input
        ref={doc.importInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        aria-hidden
        onChange={onImportChange}
      />

      <StudioDialog
        title={t("openTitle")}
        open={doc.modal === "open"}
        onClose={() => doc.setModal(null)}
        width={560}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              {t("cancel")}
            </button>
            <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.openFromInput()}>
              {doc.cloudBusy ? t("opening") : t("openFromLink")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {t("openLead")}
        </p>
        <label className="studio-dialog-label" htmlFor="studio-open-input">
          {t("shareLinkOrId")}
        </label>
        <input
          id="studio-open-input"
          className="studio-dialog-input"
          type="text"
          placeholder="https://3dboxstudio.com/studio/…"
          value={doc.openInput}
          onChange={(e) => {
            doc.setOpenInput(e.target.value);
            doc.setOpenError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void doc.openFromInput();
          }}
          autoFocus
        />
        {doc.openError && (
          <p className="studio-dialog-error" role="alert">
            {doc.openError}
          </p>
        )}

        <div className="studio-open-section">
          <h3 className="studio-open-section-title">{t("myProjects")}</h3>
          <StudioProjectsPanel
            open={doc.modal === "open"}
            user={authUser}
            onSignIn={onSignIn}
            onOpenProject={(id) => void doc.openProject(id)}
            onStatus={(message) => doc.showStatus(message)}
          />
        </div>
      </StudioDialog>

      <StudioDialog
        title={t("recentTitle")}
        open={doc.modal === "recent"}
        onClose={() => doc.setModal(null)}
        width={520}
        footer={
          <>
            {doc.recentDesigns.length > 0 && (
              <button type="button" className="btn btn-ghost studio-recent-clear" onClick={doc.clearAllRecentDesigns}>
                {t("clearList")}
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => doc.setModal(null)}>
              {t("close")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {t("recentLead")}
        </p>
        {doc.recentDesigns.length === 0 ? (
          <p className="studio-dialog-hint studio-recent-empty">
            {t.rich("recentEmpty", { strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        ) : (
          <ul className="studio-recent-list">
            {doc.recentDesigns.map((entry) => (
              <li key={entry.id} className="studio-recent-item">
                <div className="studio-recent-item-main">
                  <span className="studio-recent-name">{entry.name ?? entry.id}</span>
                  <span className="studio-recent-meta">
                    {entry.name && <span className="studio-recent-id-inline">{entry.id}</span>}
                    {entry.name && " · "}
                    {formatRecentTimestamp(entry.lastOpenedAt)}
                    {" · "}
                    {entry.source === "saved" ? t("saved") : t("opened")}
                  </span>
                </div>
                <div className="studio-recent-item-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={doc.cloudBusy}
                    onClick={() => void doc.openRecentDesign(entry.id)}
                  >
                    {t("open")}
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={t("removeFromRecent", { id: entry.id })}
                    onClick={() => doc.removeRecentDesignEntry(entry.id)}
                  >
                    {t("remove")}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </StudioDialog>

      <StudioDialog
        title={doc.saveAsIsCopy ? t("saveCopyTitle") : t("saveAsTitle")}
        open={doc.modal === "save-as"}
        onClose={() => {
          doc.cancelPendingLeave();
          doc.setSaveAsLink(null);
          doc.setSaveAsPreviewLink(null);
        }}
        footer={
          doc.saveAsLink ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
                {t("close")}
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void copySaveAsPreviewLink()}>
                {t("copyPreviewLink")}
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void copySaveAsLink()}>
                {t("copyEditorLink")}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={doc.cancelPendingLeave}>
                {t("cancel")}
              </button>
              <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.saveCloudAs()}>
                {doc.cloudBusy ? t("saving") : t("saveToCloud")}
              </button>
            </>
          )
        }
      >
        {doc.saveAsLink ? (
          <>
            <p className="studio-dialog-lead">
              {doc.saveAsIsCopy
                ? doc.activeShareName
                  ? t("namedCopyCreated", { name: doc.activeShareName })
                  : t("copyCreated")
                : doc.activeShareName
                  ? t("namedUploaded", { name: doc.activeShareName })
                  : t("uploaded")}
            </p>
            <label className="studio-dialog-label">{t("editorLink")}</label>
            <input className="studio-dialog-input" type="text" readOnly value={doc.saveAsLink} onFocus={(e) => e.target.select()} />
            <p className="studio-dialog-hint">{t("editorLinkHint")}</p>
            <label className="studio-dialog-label">{t("previewLink")}</label>
            <input
              className="studio-dialog-input"
              type="text"
              readOnly
              value={doc.saveAsPreviewLink ?? doc.getPreviewLink() ?? ""}
              onFocus={(e) => e.target.select()}
            />
            <p className="studio-dialog-hint">
              {t("previewLinkHint")}
            </p>
          </>
        ) : (
          <>
            <p className="studio-dialog-lead">
              {doc.saveAsIsCopy
                ? t("duplicateLead")
                : t("saveAsLead")}
            </p>
            <label className="studio-dialog-label" htmlFor="studio-save-as-name">
              {t("designName")} <span className="studio-dialog-optional">{t("optional")}</span>
            </label>
            <input
              id="studio-save-as-name"
              className="studio-dialog-input"
              type="text"
              placeholder={t("namePlaceholder")}
              value={doc.saveAsName}
              maxLength={120}
              onChange={(e) => {
                doc.setSaveAsName(e.target.value);
                doc.setSaveAsNameError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") void doc.saveCloudAs();
              }}
              autoFocus
            />
            {doc.saveAsNameError && (
              <p className="studio-dialog-error" role="alert">
                {doc.saveAsNameError}
              </p>
            )}
            <p className="studio-dialog-hint">{t("saveLaterHint")}</p>
          </>
        )}
      </StudioDialog>

      <StudioDialog
        title={t("sharePreviewTitle")}
        open={doc.modal === "share-preview"}
        onClose={() => doc.setModal(null)}
        width={520}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              {t("close")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void doc.copyEditorLink()}>
              {t("copyEditorLink")}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void doc.copyPreviewLink()}>
              {t("copyPreviewLink")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {t("sharePreviewLead")}
        </p>
        <label className="studio-dialog-label">{t("previewLink")}</label>
        <input
          className="studio-dialog-input"
          type="text"
          readOnly
          value={doc.getPreviewLink() ?? ""}
          onFocus={(e) => e.target.select()}
        />
        <p className="studio-dialog-hint studio-share-preview-note">
          {t.rich("previewSecurityHint", { code: (chunks) => <code>{chunks}</code> })}
        </p>
        <label className="studio-dialog-label">{t("editorLink")}</label>
        <input
          className="studio-dialog-input"
          type="text"
          readOnly
          value={doc.getEditorLink() ?? ""}
          onFocus={(e) => e.target.select()}
        />
      </StudioDialog>

      <StudioDialog
        title={t("renameTitle")}
        open={doc.modal === "rename"}
        onClose={() => doc.setModal(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              {t("cancel")}
            </button>
            <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.renameCloudShare()}>
              {doc.cloudBusy ? t("saving") : t("rename")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">{t("renameLead")}</p>
        <label className="studio-dialog-label" htmlFor="studio-rename-input">
          {t("designName")}
        </label>
        <input
          id="studio-rename-input"
          className="studio-dialog-input"
          type="text"
          placeholder={t("renamePlaceholder")}
          value={doc.renameInput}
          maxLength={120}
          onChange={(e) => {
            doc.setRenameInput(e.target.value);
            doc.setRenameError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") void doc.renameCloudShare();
          }}
          autoFocus
        />
        {doc.renameError && (
          <p className="studio-dialog-error" role="alert">
            {doc.renameError}
          </p>
        )}
        <p className="studio-dialog-hint">{t("renameHint")}</p>
      </StudioDialog>

      <StudioDialog
        title={t("exportTitle")}
        open={doc.modal === "export"}
        onClose={() => doc.setModal(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              {t("cancel")}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void doc.exportJson()}>
              {t("downloadJson")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {t("exportLead")}
        </p>
        <p className="studio-dialog-hint">{t("exportHint")}</p>
      </StudioDialog>

      <StudioDialog
        title={t("importTitle")}
        open={doc.modal === "import"}
        onClose={() => doc.setModal(null)}
        footer={
          <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
            {t("cancel")}
          </button>
        }
      >
        <p className="studio-dialog-lead">{t("importLead")}</p>
        <div
          className={`studio-import-drop${dragOver ? " is-dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p>{t("dropJson")}</p>
          <button type="button" className="btn" onClick={() => doc.importInputRef.current?.click()}>
            {t("chooseFile")}
          </button>
        </div>
      </StudioDialog>

      <StudioDialog
        title={doc.pendingLeaveAction === "new" ? t("saveBeforeNewTitle") : t("saveBeforeOpenTitle")}
        open={doc.modal === "unsaved" || doc.modal === "new"}
        onClose={doc.cancelPendingLeave}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={doc.cancelPendingLeave}>
              {t("cancel")}
            </button>
            <button type="button" className="btn" onClick={doc.confirmDiscardAndLeave}>
              {t("dontSave")}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              disabled={doc.cloudBusy}
              onClick={() => void doc.confirmSaveAndLeave()}
            >
              {doc.cloudBusy ? t("saving") : t("save")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {doc.pendingLeaveAction === "new"
            ? t("saveBeforeNewLead")
            : t("saveBeforeOpenLead")}
        </p>
        <p className="studio-dialog-hint">{t("dontSaveHint")}</p>
      </StudioDialog>
    </>
  );
}
