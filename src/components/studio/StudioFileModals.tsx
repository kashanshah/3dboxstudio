"use client";

import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import StudioDialog from "./StudioDialog";
import type { useStudioDocument } from "@/hooks/useStudioDocument";
import { formatRecentTimestamp } from "@/lib/recentDesigns";

type StudioFileModalsProps = {
  doc: ReturnType<typeof useStudioDocument>;
};

export default function StudioFileModals({ doc }: StudioFileModalsProps) {
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
      doc.showStatus("Editor link copied to clipboard.");
    } catch {
      doc.showStatus("Could not copy link.");
    }
  }, [doc]);

  const copySaveAsPreviewLink = useCallback(async () => {
    const url = doc.saveAsPreviewLink ?? doc.getPreviewLink();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      doc.showStatus("Preview link copied to clipboard.");
    } catch {
      doc.showStatus("Could not copy preview link.");
    }
  }, [doc]);

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
        title="Open Design"
        open={doc.modal === "open"}
        onClose={() => doc.setModal(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.openFromInput()}>
              {doc.cloudBusy ? "Opening…" : "Open"}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          Paste a share link or ID from a previously saved cloud design.
        </p>
        <label className="studio-dialog-label" htmlFor="studio-open-input">
          Share link or ID
        </label>
        <input
          id="studio-open-input"
          className="studio-dialog-input"
          type="text"
          placeholder="https://3dboxstudio.com/studio?share=…"
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
      </StudioDialog>

      <StudioDialog
        title="Recent Designs"
        open={doc.modal === "recent"}
        onClose={() => doc.setModal(null)}
        width={520}
        footer={
          <>
            {doc.recentDesigns.length > 0 && (
              <button type="button" className="btn btn-ghost studio-recent-clear" onClick={doc.clearAllRecentDesigns}>
                Clear list
              </button>
            )}
            <button type="button" className="btn btn-primary" onClick={() => doc.setModal(null)}>
              Close
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          Cloud designs you saved or opened on this browser. Select one to reopen, or remove entries you no longer need.
        </p>
        {doc.recentDesigns.length === 0 ? (
          <p className="studio-dialog-hint studio-recent-empty">
            No recent designs yet. Use <strong>File → Save As</strong> to create a share link, or open a design from a link to
            see it here.
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
                    {entry.source === "saved" ? "Saved" : "Opened"}
                  </span>
                </div>
                <div className="studio-recent-item-actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={doc.cloudBusy}
                    onClick={() => void doc.openRecentDesign(entry.id)}
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    aria-label={`Remove ${entry.id} from recent`}
                    onClick={() => doc.removeRecentDesignEntry(entry.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </StudioDialog>

      <StudioDialog
        title="Save As"
        open={doc.modal === "save-as"}
        onClose={() => {
          doc.setModal(null);
          doc.setSaveAsLink(null);
          doc.setSaveAsPreviewLink(null);
        }}
        footer={
          doc.saveAsLink ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
                Close
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => void copySaveAsPreviewLink()}>
                Copy preview link
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void copySaveAsLink()}>
                Copy editor link
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.saveCloudAs()}>
                {doc.cloudBusy ? "Saving…" : "Save to cloud"}
              </button>
            </>
          )
        }
      >
        {doc.saveAsLink ? (
          <>
            <p className="studio-dialog-lead">
              {doc.activeShareName
                ? `“${doc.activeShareName}” was uploaded. Copy an editor link for yourself or a view-only preview link for clients.`
                : "Your design was uploaded. Copy an editor link for yourself or a view-only preview link for clients."}
            </p>
            <label className="studio-dialog-label">Editor link</label>
            <input className="studio-dialog-input" type="text" readOnly value={doc.saveAsLink} onFocus={(e) => e.target.select()} />
            <p className="studio-dialog-hint">Full studio access — you can edit and save changes with File → Save (⌘S).</p>
            <label className="studio-dialog-label">View-only preview link</label>
            <input
              className="studio-dialog-input"
              type="text"
              readOnly
              value={doc.saveAsPreviewLink ?? doc.getPreviewLink() ?? ""}
              onFocus={(e) => e.target.select()}
            />
            <p className="studio-dialog-hint">
              Clients can orbit, zoom, and export PNGs but cannot change dimensions, artwork, or save over your design.
            </p>
          </>
        ) : (
          <>
            <p className="studio-dialog-lead">
              Upload the current design to the cloud and get a new shareable link. Images and settings are stored on AWS; config is saved in the database.
            </p>
            <label className="studio-dialog-label" htmlFor="studio-save-as-name">
              Design name <span className="studio-dialog-optional">(optional)</span>
            </label>
            <input
              id="studio-save-as-name"
              className="studio-dialog-input"
              type="text"
              placeholder="e.g. Holiday gift box"
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
            <p className="studio-dialog-hint">Use Save (⌘S) later to update an existing link without creating a new one.</p>
          </>
        )}
      </StudioDialog>

      <StudioDialog
        title="Share Preview Link"
        open={doc.modal === "share-preview"}
        onClose={() => doc.setModal(null)}
        width={520}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              Close
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void doc.copyEditorLink()}>
              Copy editor link
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void doc.copyPreviewLink()}>
              Copy preview link
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          Send clients a view-only link for presentations and approvals. They can explore the 3D box, adjust lighting, and
          export PNGs — without editing your design.
        </p>
        <label className="studio-dialog-label">View-only preview link</label>
        <input
          className="studio-dialog-input"
          type="text"
          readOnly
          value={doc.getPreviewLink() ?? ""}
          onFocus={(e) => e.target.select()}
        />
        <p className="studio-dialog-hint studio-share-preview-note">
          Preview links end with <code>&view=1</code>. Keep the editor link private if you do not want others to change the design.
        </p>
        <label className="studio-dialog-label">Editor link</label>
        <input
          className="studio-dialog-input"
          type="text"
          readOnly
          value={doc.getEditorLink() ?? ""}
          onFocus={(e) => e.target.select()}
        />
      </StudioDialog>

      <StudioDialog
        title="Rename Design"
        open={doc.modal === "rename"}
        onClose={() => doc.setModal(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.renameCloudShare()}>
              {doc.cloudBusy ? "Saving…" : "Rename"}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">Change the name shown in the title bar and recent list for this cloud design.</p>
        <label className="studio-dialog-label" htmlFor="studio-rename-input">
          Design name
        </label>
        <input
          id="studio-rename-input"
          className="studio-dialog-input"
          type="text"
          placeholder="Leave blank to remove the name"
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
        <p className="studio-dialog-hint">The share link and ID stay the same. Only the display name changes.</p>
      </StudioDialog>

      <StudioDialog
        title="Export JSON"
        open={doc.modal === "export"}
        onClose={() => doc.setModal(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={() => void doc.exportJson()}>
              Download JSON
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          Download a v1 JSON file with dimensions, materials, openings, viewport options, per-face rotations, and embedded images as base64.
        </p>
        <p className="studio-dialog-hint">Use this for offline backups or to move a design between machines without cloud storage.</p>
      </StudioDialog>

      <StudioDialog
        title="Import JSON"
        open={doc.modal === "import"}
        onClose={() => doc.setModal(null)}
        footer={
          <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
            Cancel
          </button>
        }
      >
        <p className="studio-dialog-lead">Import a v1 JSON export from this studio. The current design will be replaced.</p>
        <div
          className={`studio-import-drop${dragOver ? " is-dragover" : ""}`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          <p>Drop a .json file here</p>
          <button type="button" className="btn" onClick={() => doc.importInputRef.current?.click()}>
            Choose file…
          </button>
        </div>
      </StudioDialog>

      <StudioDialog
        title="New Design"
        open={doc.modal === "new"}
        onClose={() => doc.setModal(null)}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={doc.newDocument}>
              Discard & start new
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">Start a blank design? Unsaved changes to the current session will be lost.</p>
        <p className="studio-dialog-hint">Existing cloud share links are not deleted.</p>
      </StudioDialog>
    </>
  );
}
