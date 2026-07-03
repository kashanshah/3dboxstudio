"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  defaultBoxDesignerState,
  deserializeDesign,
  deserializeSharedDesign,
  serializeDesign,
  type BoxDesignerPersistedState,
} from "@/boxDesignPersistence";
import { parseShareIdFromInput, studioSharePath } from "@/lib/shareUrl";

export type StudioFileModal = "open" | "save-as" | "export" | "import" | "new" | null;

type ShareApiResult = { id: string; url: string };
type ShareApiError = { error: string };

function readApiError(data: unknown, fallback: string): string {
  if (typeof data === "object" && data !== null && "error" in data && typeof (data as ShareApiError).error === "string") {
    return (data as ShareApiError).error;
  }
  return fallback;
}

function parseShareResult(data: unknown): ShareApiResult {
  if (
    typeof data === "object" &&
    data !== null &&
    "url" in data &&
    typeof (data as ShareApiResult).url === "string" &&
    "id" in data &&
    typeof (data as ShareApiResult).id === "string"
  ) {
    return data as ShareApiResult;
  }
  throw new Error("Unexpected response from share API.");
}

type UseStudioDocumentOptions = {
  buildPersistState: () => BoxDesignerPersistedState;
  applyPersistedState: (state: BoxDesignerPersistedState) => void;
  initialShareId: string | null;
  sessionReady: boolean;
};

export function useStudioDocument({
  buildPersistState,
  applyPersistedState,
  initialShareId,
  sessionReady,
}: UseStudioDocumentOptions) {
  const [activeShareId, setActiveShareId] = useState<string | null>(initialShareId);
  const [isDirty, setIsDirty] = useState(false);
  const [modal, setModal] = useState<StudioFileModal>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [saveAsLink, setSaveAsLink] = useState<string | null>(null);
  const [openInput, setOpenInput] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  const bootstrapDone = useRef(false);
  const skipDirtyOnce = useRef(false);

  const markClean = useCallback(() => {
    skipDirtyOnce.current = true;
    setIsDirty(false);
  }, []);

  const showStatus = useCallback((message: string, ms = 4500) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), ms);
  }, []);

  const syncUrlToShare = useCallback((id: string | null) => {
    if (id) {
      window.history.replaceState(null, "", studioSharePath(id));
    } else {
      window.history.replaceState(null, "", "/studio");
    }
  }, []);

  useEffect(() => {
    if (initialShareId) setActiveShareId(initialShareId);
  }, [initialShareId]);

  useEffect(() => {
    if (!sessionReady) return;
    if (!bootstrapDone.current) {
      bootstrapDone.current = true;
      return;
    }
    if (skipDirtyOnce.current) {
      skipDirtyOnce.current = false;
      return;
    }
    setIsDirty(true);
  }, [sessionReady, buildPersistState]);

  const loadShareById = useCallback(
    async (shareId: string): Promise<boolean> => {
      const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}`);
      const data: unknown = res.ok ? await res.json() : null;
      if (!res.ok || !data) {
        throw new Error(readApiError(data, "Could not load shared design."));
      }
      const restored = await deserializeSharedDesign(data);
      if (!restored) throw new Error("Shared design could not be restored.");
      applyPersistedState(restored);
      setActiveShareId(shareId);
      syncUrlToShare(shareId);
      setIsDirty(false);
      return true;
    },
    [applyPersistedState, syncUrlToShare]
  );

  const saveCloud = useCallback(async () => {
    if (!activeShareId) {
      setSaveAsLink(null);
      setModal("save-as");
      return;
    }
    setCloudBusy(true);
    try {
      const json = await serializeDesign(buildPersistState());
      const res = await fetch(`/api/shares/${encodeURIComponent(activeShareId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(data, "Could not save design."));
      parseShareResult(data);
      setIsDirty(false);
      showStatus("Design saved to cloud.");
    } catch (e) {
      showStatus(e instanceof Error ? e.message : "Could not save design.", 6000);
    } finally {
      setCloudBusy(false);
    }
  }, [activeShareId, buildPersistState, showStatus]);

  const saveCloudAs = useCallback(async () => {
    setCloudBusy(true);
    setSaveAsLink(null);
    try {
      const json = await serializeDesign(buildPersistState());
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(data, "Could not create share link."));
      const { id, url } = parseShareResult(data);
      setActiveShareId(id);
      syncUrlToShare(id);
      setSaveAsLink(url);
      setIsDirty(false);
      try {
        await navigator.clipboard.writeText(url);
        showStatus("New share link created and copied.");
      } catch {
        showStatus("New share link created.");
      }
    } catch (e) {
      showStatus(e instanceof Error ? e.message : "Could not create share link.", 6000);
    } finally {
      setCloudBusy(false);
    }
  }, [buildPersistState, showStatus, syncUrlToShare]);

  const openFromInput = useCallback(async () => {
    const shareId = parseShareIdFromInput(openInput);
    if (!shareId) {
      setOpenError("Enter a valid share link or ID.");
      return;
    }
    setOpenError(null);
    setCloudBusy(true);
    try {
      await loadShareById(shareId);
      setModal(null);
      setOpenInput("");
      showStatus("Design opened from cloud.");
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : "Could not open design.");
    } finally {
      setCloudBusy(false);
    }
  }, [loadShareById, openInput, showStatus]);

  const exportJson = useCallback(async () => {
    const json = await serializeDesign(buildPersistState());
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `3d-box-design-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setModal(null);
    showStatus("JSON file downloaded (includes embedded images).");
  }, [buildPersistState, showStatus]);

  const importJsonFile = useCallback(
    async (file: File) => {
      let text: string;
      try {
        text = await file.text();
      } catch {
        showStatus("Could not read that file.", 5000);
        return;
      }
      const restored = await deserializeDesign(text);
      if (!restored) {
        showStatus("Invalid JSON: expected a v1 design export from this studio.", 6000);
        return;
      }
      applyPersistedState(restored);
      setActiveShareId(null);
      syncUrlToShare(null);
      setIsDirty(true);
      setModal(null);
      showStatus(`Imported “${file.name}”.`);
    },
    [applyPersistedState, showStatus, syncUrlToShare]
  );

  const newDocument = useCallback(() => {
    applyPersistedState(defaultBoxDesignerState());
    setActiveShareId(null);
    syncUrlToShare(null);
    setIsDirty(false);
    setModal(null);
    showStatus("New design started.");
  }, [applyPersistedState, showStatus, syncUrlToShare]);

  const requestNew = useCallback(() => {
    if (isDirty) {
      setModal("new");
      return;
    }
    newDocument();
  }, [isDirty, newDocument]);

  const documentTitle = activeShareId
    ? `Cloud · ${activeShareId.slice(0, 8)}…${isDirty ? " •" : ""}`
    : `Untitled design${isDirty ? " •" : ""}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s" && e.shiftKey) {
        e.preventDefault();
        setSaveAsLink(null);
        setModal("save-as");
      } else if (key === "s") {
        e.preventDefault();
        void saveCloud();
      } else if (key === "o") {
        e.preventDefault();
        setOpenError(null);
        setModal("open");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveCloud]);

  return {
    activeShareId,
    isDirty,
    modal,
    setModal,
    statusMessage,
    cloudBusy,
    saveAsLink,
    setSaveAsLink,
    openInput,
    setOpenInput,
    openError,
    setOpenError,
    importInputRef,
    documentTitle,
    saveCloud,
    saveCloudAs,
    openFromInput,
    exportJson,
    importJsonFile,
    newDocument,
    requestNew,
    showStatus,
    markClean,
  };
}
