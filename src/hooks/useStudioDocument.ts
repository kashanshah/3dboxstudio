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
import {
  addRecentDesign,
  clearRecentDesigns,
  readRecentDesigns,
  removeRecentDesign,
  updateRecentDesignName,
  type RecentDesignEntry,
} from "@/lib/recentDesigns";
import { displayShareLabel, normalizeShareName, shareNameError } from "@/lib/shareName";

export type StudioFileModal = "open" | "recent" | "save-as" | "rename" | "export" | "import" | "new" | null;

type ShareApiResult = { id: string; url: string; name?: string | null };
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

function readShareNameFromPayload(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const name = (data as { shareName?: unknown }).shareName;
  return typeof name === "string" ? normalizeShareName(name) : null;
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
  const [activeShareName, setActiveShareName] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [modal, setModal] = useState<StudioFileModal>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [saveAsLink, setSaveAsLink] = useState<string | null>(null);
  const [saveAsName, setSaveAsName] = useState("");
  const [saveAsNameError, setSaveAsNameError] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [openInput, setOpenInput] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
  const [recentDesigns, setRecentDesigns] = useState<RecentDesignEntry[]>([]);
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

  const refreshRecentDesigns = useCallback(() => {
    setRecentDesigns(readRecentDesigns());
  }, []);

  const rememberRecent = useCallback(
    (id: string, source: "opened" | "saved", url?: string, name?: string | null) => {
      addRecentDesign({ id, url, source, name: name ?? activeShareName });
      refreshRecentDesigns();
    },
    [refreshRecentDesigns, activeShareName]
  );

  useEffect(() => {
    if (modal === "recent") refreshRecentDesigns();
  }, [modal, refreshRecentDesigns]);

  const openSaveAsModal = useCallback(() => {
    setSaveAsLink(null);
    setSaveAsName(activeShareName ?? "");
    setSaveAsNameError(null);
    setModal("save-as");
  }, [activeShareName]);

  const openRenameModal = useCallback(() => {
    if (!activeShareId) return;
    setRenameInput(activeShareName ?? "");
    setRenameError(null);
    setModal("rename");
  }, [activeShareId, activeShareName]);

  const loadShareById = useCallback(
    async (shareId: string, source: "opened" | "saved" = "opened"): Promise<boolean> => {
      const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}`);
      const data: unknown = res.ok ? await res.json() : null;
      if (!res.ok || !data) {
        throw new Error(readApiError(data, "Could not load shared design."));
      }
      const restored = await deserializeSharedDesign(data);
      if (!restored) throw new Error("Shared design could not be restored.");
      const shareName = readShareNameFromPayload(data);
      applyPersistedState(restored);
      setActiveShareId(shareId);
      setActiveShareName(shareName);
      syncUrlToShare(shareId);
      setIsDirty(false);
      rememberRecent(shareId, source, undefined, shareName);
      return true;
    },
    [applyPersistedState, syncUrlToShare, rememberRecent]
  );

  const saveCloud = useCallback(async () => {
    if (!activeShareId) {
      openSaveAsModal();
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
      const result = parseShareResult(data);
      if (result.name !== undefined) setActiveShareName(normalizeShareName(result.name));
      setIsDirty(false);
      rememberRecent(activeShareId, "saved", undefined, result.name ?? activeShareName);
      showStatus(activeShareName ? `“${activeShareName}” saved to cloud.` : "Design saved to cloud.");
    } catch (e) {
      showStatus(e instanceof Error ? e.message : "Could not save design.", 6000);
    } finally {
      setCloudBusy(false);
    }
  }, [activeShareId, activeShareName, buildPersistState, showStatus, rememberRecent, openSaveAsModal]);

  const saveCloudAs = useCallback(async () => {
    const nameError = shareNameError(saveAsName);
    if (nameError) {
      setSaveAsNameError(nameError);
      return;
    }

    const normalizedName = normalizeShareName(saveAsName);
    setSaveAsNameError(null);
    setCloudBusy(true);
    setSaveAsLink(null);
    try {
      const json = await serializeDesign(buildPersistState());
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (normalizedName) headers["X-Share-Name"] = normalizedName;

      const res = await fetch("/api/shares", {
        method: "POST",
        headers,
        body: json,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(data, "Could not create share link."));
      const { id, url, name } = parseShareResult(data);
      const resolvedName = normalizeShareName(name ?? normalizedName);
      setActiveShareId(id);
      setActiveShareName(resolvedName);
      syncUrlToShare(id);
      setSaveAsLink(url);
      setIsDirty(false);
      rememberRecent(id, "saved", url, resolvedName);
      try {
        await navigator.clipboard.writeText(url);
        showStatus(resolvedName ? `“${resolvedName}” saved and link copied.` : "New share link created and copied.");
      } catch {
        showStatus(resolvedName ? `“${resolvedName}” saved to cloud.` : "New share link created.");
      }
    } catch (e) {
      showStatus(e instanceof Error ? e.message : "Could not create share link.", 6000);
    } finally {
      setCloudBusy(false);
    }
  }, [buildPersistState, saveAsName, showStatus, syncUrlToShare, rememberRecent]);

  const renameCloudShare = useCallback(async () => {
    if (!activeShareId) return;

    const nameError = shareNameError(renameInput);
    if (nameError) {
      setRenameError(nameError);
      return;
    }

    const normalizedName = normalizeShareName(renameInput);
    setRenameError(null);
    setCloudBusy(true);
    try {
      const res = await fetch(`/api/shares/${encodeURIComponent(activeShareId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: normalizedName ?? "" }),
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(data, "Could not rename design."));
      const result = data as { name?: string | null };
      const resolvedName = normalizeShareName(result.name ?? normalizedName);
      setActiveShareName(resolvedName);
      updateRecentDesignName(activeShareId, resolvedName);
      refreshRecentDesigns();
      setModal(null);
      showStatus(resolvedName ? `Renamed to “${resolvedName}”.` : "Design name cleared.");
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : "Could not rename design.");
    } finally {
      setCloudBusy(false);
    }
  }, [activeShareId, renameInput, showStatus, refreshRecentDesigns]);

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

  const openRecentDesign = useCallback(
    async (shareId: string) => {
      setCloudBusy(true);
      try {
        await loadShareById(shareId, "opened");
        setModal(null);
        showStatus("Design opened from recent.");
      } catch (e) {
        showStatus(e instanceof Error ? e.message : "Could not open design.", 6000);
      } finally {
        setCloudBusy(false);
      }
    },
    [loadShareById, showStatus]
  );

  const removeRecentDesignEntry = useCallback(
    (shareId: string) => {
      removeRecentDesign(shareId);
      refreshRecentDesigns();
    },
    [refreshRecentDesigns]
  );

  const clearAllRecentDesigns = useCallback(() => {
    clearRecentDesigns();
    refreshRecentDesigns();
    showStatus("Recent list cleared.");
  }, [refreshRecentDesigns, showStatus]);

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
      setActiveShareName(null);
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
    setActiveShareName(null);
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

  const documentTitle = `${displayShareLabel(activeShareName, activeShareId)}${isDirty ? " •" : ""}`;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s" && e.shiftKey) {
        e.preventDefault();
        openSaveAsModal();
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
  }, [saveCloud, openSaveAsModal]);

  return {
    activeShareId,
    activeShareName,
    isDirty,
    modal,
    setModal,
    statusMessage,
    cloudBusy,
    saveAsLink,
    setSaveAsLink,
    saveAsName,
    setSaveAsName,
    saveAsNameError,
    setSaveAsNameError,
    renameInput,
    setRenameInput,
    renameError,
    setRenameError,
    openInput,
    setOpenInput,
    openError,
    setOpenError,
    importInputRef,
    documentTitle,
    saveCloud,
    saveCloudAs,
    openSaveAsModal,
    openRenameModal,
    renameCloudShare,
    openFromInput,
    loadShareById,
    openRecentDesign,
    recentDesigns,
    removeRecentDesignEntry,
    clearAllRecentDesigns,
    refreshRecentDesigns,
    exportJson,
    importJsonFile,
    newDocument,
    requestNew,
    showStatus,
    markClean,
  };
}
