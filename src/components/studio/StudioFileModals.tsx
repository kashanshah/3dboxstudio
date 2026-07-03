"use client";

import { useCallback, useState, type ChangeEvent, type DragEvent } from "react";
import StudioDialog from "./StudioDialog";
import type { useStudioDocument } from "@/hooks/useStudioDocument";

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
      doc.showStatus("Link copied to clipboard.");
    } catch {
      doc.showStatus("Could not copy link.");
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
        title="Save As"
        open={doc.modal === "save-as"}
        onClose={() => {
          doc.setModal(null);
          doc.setSaveAsLink(null);
        }}
        footer={
          doc.saveAsLink ? (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void copySaveAsLink()}>
                Copy link
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => doc.setModal(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" disabled={doc.cloudBusy} onClick={() => void doc.saveCloudAs()}>
                {doc.cloudBusy ? "Creating…" : "Create share link"}
              </button>
            </>
          )
        }
      >
        {doc.saveAsLink ? (
          <>
            <p className="studio-dialog-lead">Your design was uploaded and a new share link was created.</p>
            <label className="studio-dialog-label">Share link</label>
            <input className="studio-dialog-input" type="text" readOnly value={doc.saveAsLink} onFocus={(e) => e.target.select()} />
            <p className="studio-dialog-hint">Anyone with this link can view the design. Use File → Save to update this link later.</p>
          </>
        ) : (
          <>
            <p className="studio-dialog-lead">
              Upload the current design to the cloud and get a new shareable link. Images and settings are stored on AWS; config is saved in the database.
            </p>
            <p className="studio-dialog-hint">Use Save (⌘S) later to update an existing link without creating a new one.</p>
          </>
        )}
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
