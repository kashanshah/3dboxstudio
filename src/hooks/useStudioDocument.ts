"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  beginReopenedDesignSession,
  trackExportClicked,
  trackExportCompleted,
  trackExportFailed,
  trackProjectSaved,
  trackStudioError,
  type BoxType,
  type TemplateType,
  type UserStatus,
} from "@/lib/analytics";
import {
  defaultBoxDesignerState,
  deserializeDesign,
  deserializeSharedDesign,
  serializeDesign,
  type BoxDesignerPersistedState,
} from "@/boxDesignPersistence";
import { parseShareIdFromInput, studioPreviewPath, studioPreviewUrl, studioSharePath, studioShareUrl, toShareCacheVersion } from "@/lib/shareUrl";
import {
  addRecentDesign,
  clearRecentDesigns,
  readRecentDesigns,
  removeRecentDesign,
  updateRecentDesignName,
  type RecentDesignEntry,
} from "@/lib/recentDesigns";
import { displayShareLabel, DEFAULT_UNTITLED_SHARE_NAME, normalizeShareName, shareNameError } from "@/lib/shareName";
import { uploadShareOgImageToCloud, type ShareOgImageBlob } from "@/lib/shareOgImage";
import type { AuthUser } from "@/lib/authTypes";

export type StudioFileModal =
  | "open"
  | "recent"
  | "save-as"
  | "rename"
  | "share-preview"
  | "export"
  | "import"
  | "new"
  | "unsaved"
  | null;

export type StudioLeaveIntent = "new" | "open" | "recent";

type ShareApiResult = {
  id: string;
  url: string;
  previewUrl?: string;
  previewToken?: string;
  name?: string | null;
  updatedAt?: string;
};
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

function readPreviewTokenFromPayload(data: unknown): string | null {
  if (typeof data !== "object" || data === null) return null;
  const token = (data as { previewToken?: unknown }).previewToken;
  return typeof token === "string" && /^[0-9A-Za-z]{10,24}$/.test(token) ? token : null;
}

function readShareUpdatedAt(data: unknown): number | null {
  if (typeof data !== "object" || data === null) return null;
  const updatedAt = (data as { updatedAt?: unknown; shareUpdatedAt?: unknown }).updatedAt
    ?? (data as { shareUpdatedAt?: unknown }).shareUpdatedAt;
  return toShareCacheVersion(typeof updatedAt === "string" ? updatedAt : null);
}

type StudioAnalyticsContext = {
  templateType?: TemplateType | string;
  boxType?: BoxType | string;
  userStatus?: UserStatus;
};

type UseStudioDocumentOptions = {
  buildPersistState: () => BoxDesignerPersistedState;
  applyPersistedState: (state: BoxDesignerPersistedState) => void;
  initialShareId: string | null;
  sessionReady: boolean;
  viewOnly?: boolean;
  capturePreviewImage?: () => Promise<ShareOgImageBlob | null>;
  authUser?: AuthUser | null;
  authLoading?: boolean;
  onRequireSignIn?: () => void;
  getAnalyticsContext?: () => StudioAnalyticsContext;
  onDesignSessionStart?: () => void;
};

async function uploadOgPreviewIfPresent(
  shareId: string,
  preview: ShareOgImageBlob | null,
  onPhase: (message: string) => void
): Promise<number | null> {
  if (!preview) return null;
  onPhase("Uploading preview image to cloud…");
  await uploadShareOgImageToCloud(shareId, preview);
  return Date.now();
}

export function useStudioDocument({
  buildPersistState,
  applyPersistedState,
  initialShareId,
  sessionReady,
  viewOnly = false,
  capturePreviewImage,
  authUser = null,
  authLoading = false,
  onRequireSignIn,
  getAnalyticsContext,
  onDesignSessionStart,
}: UseStudioDocumentOptions) {
  const t = useTranslations("studio.status");
  const [activeShareId, setActiveShareId] = useState<string | null>(initialShareId);
  const [activePreviewToken, setActivePreviewToken] = useState<string | null>(null);
  const [activeShareName, setActiveShareName] = useState<string | null>(null);
  const [previewCacheVersion, setPreviewCacheVersion] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [modal, setModal] = useState<StudioFileModal>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [saveOverlayMessage, setSaveOverlayMessage] = useState<string | null>(null);
  const [saveAsLink, setSaveAsLink] = useState<string | null>(null);
  const [saveAsPreviewLink, setSaveAsPreviewLink] = useState<string | null>(null);
  const [saveAsName, setSaveAsName] = useState("");
  const [saveAsNameError, setSaveAsNameError] = useState<string | null>(null);
  const [saveAsIsCopy, setSaveAsIsCopy] = useState(false);
  const [renameInput, setRenameInput] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [openInput, setOpenInput] = useState("");
  const [openError, setOpenError] = useState<string | null>(null);
  const [recentDesigns, setRecentDesigns] = useState<RecentDesignEntry[]>([]);
  const importInputRef = useRef<HTMLInputElement>(null);
  const bootstrapDone = useRef(false);
  const skipDirtyOnce = useRef(false);
  const activeShareIdRef = useRef<string | null>(initialShareId);
  const autoSaveInFlightRef = useRef(false);
  const autoSaveQueuedRef = useRef(false);
  const pendingLeaveRef = useRef<StudioLeaveIntent | null>(null);
  const [pendingLeaveAction, setPendingLeaveAction] = useState<StudioLeaveIntent | null>(null);
  const fulfillLeaveRef = useRef<(intent: StudioLeaveIntent) => void>(() => {});

  const analyticsCtx = useCallback(
    () => getAnalyticsContext?.() ?? {},
    [getAnalyticsContext]
  );

  const activeShareNameRef = useRef<string | null>(null);
  activeShareNameRef.current = activeShareName;

  const markProjectSaved = useCallback(() => {
    trackProjectSaved(analyticsCtx());
  }, [analyticsCtx]);

  const markProjectReopened = useCallback(
    (projectKey: string) => {
      beginReopenedDesignSession(analyticsCtx(), projectKey);
    },
    [analyticsCtx]
  );

  activeShareIdRef.current = activeShareId;

  const markClean = useCallback(() => {
    skipDirtyOnce.current = true;
    setIsDirty(false);
  }, []);

  const showStatus = useCallback((message: string, ms = 4500) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), ms);
  }, []);

  // Cloud save/share requires a signed-in user.
  const ensureCloudAccess = useCallback((): boolean => {
    if (authLoading) {
      showStatus(t("checkingAccount"), 2000);
      return false;
    }
    if (!authUser) {
      onRequireSignIn?.();
      return false;
    }
    return true;
  }, [authLoading, authUser, onRequireSignIn, showStatus, t]);

  const syncUrlToShare = useCallback((id: string | null) => {
    if (id) {
      window.history.replaceState(null, "", studioSharePath(id));
    } else {
      window.history.replaceState(null, "", "/studio");
    }
  }, []);

  const syncUrlToPreview = useCallback((previewToken: string) => {
    window.history.replaceState(null, "", studioPreviewPath(previewToken));
  }, []);

  useEffect(() => {
    if (initialShareId) setActiveShareId(initialShareId);
  }, [initialShareId]);

  useEffect(() => {
    if (!sessionReady || viewOnly) return;
    if (!bootstrapDone.current) {
      bootstrapDone.current = true;
      return;
    }
    if (skipDirtyOnce.current) {
      skipDirtyOnce.current = false;
      return;
    }
    setIsDirty(true);
  }, [sessionReady, buildPersistState, viewOnly]);

  const refreshRecentDesigns = useCallback(() => {
    setRecentDesigns(readRecentDesigns());
  }, []);

  const rememberRecent = useCallback(
    (id: string, source: "opened" | "saved", url?: string, name?: string | null) => {
      addRecentDesign({ id, url, source, name: name ?? activeShareNameRef.current });
      refreshRecentDesigns();
    },
    [refreshRecentDesigns]
  );

  useEffect(() => {
    if (modal === "recent") refreshRecentDesigns();
  }, [modal, refreshRecentDesigns]);

  const openSaveAsModal = useCallback(() => {
    if (!ensureCloudAccess()) return;
    setSaveAsLink(null);
    setSaveAsPreviewLink(null);
    const defaultName = viewOnly
      ? (activeShareName ? `Copy of ${activeShareName}` : "Copy of design").slice(0, 120)
      : (activeShareName ?? "");
    setSaveAsName(defaultName);
    setSaveAsNameError(null);
    setSaveAsIsCopy(viewOnly);
    setModal("save-as");
  }, [activeShareName, viewOnly, ensureCloudAccess]);

  // Duplicate the current design into a brand-new project. Reuses the "Save As"
  // create flow (new id, fresh images/preview) so the original stays untouched.
  const openSaveCopyModal = useCallback(() => {
    if (viewOnly) return;
    if (!ensureCloudAccess()) return;
    setSaveAsLink(null);
    setSaveAsPreviewLink(null);
    const base = activeShareName ? `Copy of ${activeShareName}` : "Copy of design";
    setSaveAsName(base.slice(0, 120));
    setSaveAsNameError(null);
    setSaveAsIsCopy(true);
    setModal("save-as");
  }, [activeShareName, viewOnly, ensureCloudAccess]);

  const openRenameModal = useCallback(() => {
    if (viewOnly || !activeShareId) return;
    setRenameInput(activeShareName ?? "");
    setRenameError(null);
    setModal("rename");
  }, [activeShareId, activeShareName, viewOnly]);

  const openSharePreviewModal = useCallback(() => {
    if (!activePreviewToken) return;
    setModal("share-preview");
  }, [activePreviewToken]);

  const getPreviewLink = useCallback(() => {
    if (!activePreviewToken) return null;
    return studioPreviewUrl(activePreviewToken, undefined, previewCacheVersion);
  }, [activePreviewToken, previewCacheVersion]);

  const getEditorLink = useCallback(
    (shareId?: string | null) => {
      const id = shareId ?? activeShareId;
      if (!id) return null;
      return studioShareUrl(id);
    },
    [activeShareId]
  );

  const copyPreviewLink = useCallback(async () => {
    const url = getPreviewLink();
    if (!url) return false;
    try {
      await navigator.clipboard.writeText(url);
      showStatus(t("previewLinkCopied"));
      return true;
    } catch {
      showStatus(t("couldNotCopyPreviewLink"), 5000);
      return false;
    }
  }, [getPreviewLink, showStatus, t]);

  const copyEditorLink = useCallback(
    async (shareId?: string | null) => {
      const url = getEditorLink(shareId);
      if (!url) return false;
      try {
        await navigator.clipboard.writeText(url);
        showStatus(t("editorLinkCopied"));
        return true;
      } catch {
        showStatus(t("couldNotCopyEditorLink"), 5000);
        return false;
      }
    },
    [getEditorLink, showStatus, t]
  );

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
      const previewToken = readPreviewTokenFromPayload(data);
      applyPersistedState(restored);
      setActiveShareId(shareId);
      setActivePreviewToken(previewToken);
      setActiveShareName(shareName);
      setPreviewCacheVersion(readShareUpdatedAt(data));
      syncUrlToShare(shareId);
      setIsDirty(false);
      rememberRecent(shareId, source, undefined, shareName);
      if (source === "opened") {
        markProjectReopened(shareId);
      }
      return true;
    },
    [applyPersistedState, syncUrlToShare, rememberRecent, markProjectReopened]
  );

  const loadShareByPreviewToken = useCallback(
    async (previewToken: string): Promise<boolean> => {
      const res = await fetch(`/api/shares/preview/${encodeURIComponent(previewToken)}`);
      const data: unknown = res.ok ? await res.json() : null;
      if (!res.ok || !data) {
        throw new Error(readApiError(data, "Could not load preview."));
      }
      const restored = await deserializeSharedDesign(data);
      if (!restored) throw new Error("Preview could not be restored.");
      const shareName = readShareNameFromPayload(data);
      applyPersistedState(restored);
      setActiveShareId(null);
      setActivePreviewToken(null);
      setActiveShareName(shareName);
      syncUrlToPreview(previewToken);
      setIsDirty(false);
      markProjectReopened(`preview:${previewToken}`);
      return true;
    },
    [applyPersistedState, syncUrlToPreview, markProjectReopened]
  );

  const saveCloud = useCallback(async (): Promise<boolean> => {
    if (viewOnly) return false;
    if (!ensureCloudAccess()) return false;
    if (!activeShareIdRef.current) {
      openSaveAsModal();
      return false;
    }
    setCloudBusy(true);
      setSaveOverlayMessage(t("savingToCloud"));
    let saved = false;
    try {
      let preview: ShareOgImageBlob | null = null;
      if (capturePreviewImage) {
        try {
          preview = await capturePreviewImage();
        } catch {
          preview = null;
        }
      }

      const shareId = activeShareIdRef.current;
      const json = await serializeDesign(buildPersistState());
      const res = await fetch(`/api/shares/${encodeURIComponent(shareId)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: json,
      });
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) throw new Error(readApiError(data, "Could not save design."));
      const result = parseShareResult(data);
      if (result.name !== undefined) setActiveShareName(normalizeShareName(result.name));
      if (result.previewToken) setActivePreviewToken(result.previewToken);

      const ogUpdatedAt = await uploadOgPreviewIfPresent(shareId, preview, setSaveOverlayMessage);
      setPreviewCacheVersion(ogUpdatedAt ?? readShareUpdatedAt(result));
      setIsDirty(false);
      rememberRecent(shareId, "saved", undefined, result.name ?? activeShareName);
      markProjectSaved();
      showStatus(activeShareName ? t("namedSavedToCloud", { name: activeShareName }) : t("designSavedToCloud"));
      saved = true;
    } catch (e) {
      showStatus(e instanceof Error ? e.message : t("couldNotSaveDesign"), 6000);
      trackStudioError("cloud_save_failed", "other");
    } finally {
      setSaveOverlayMessage(null);
      setCloudBusy(false);
    }
    return saved;
  }, [activeShareName, buildPersistState, capturePreviewImage, showStatus, rememberRecent, openSaveAsModal, viewOnly, ensureCloudAccess, markProjectSaved, t]);

  const autoSaveCloud = useCallback(async () => {
    if (viewOnly) return;
    if (!ensureCloudAccess()) return;

    if (autoSaveInFlightRef.current) {
      autoSaveQueuedRef.current = true;
      return;
    }
    autoSaveInFlightRef.current = true;
    setCloudBusy(true);

    try {
      const json = await serializeDesign(buildPersistState());
      const existingId = activeShareIdRef.current;

      if (!existingId) {
        const res = await fetch("/api/shares", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Share-Name": DEFAULT_UNTITLED_SHARE_NAME,
          },
          body: json,
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) throw new Error(readApiError(data, "Could not save design."));
        const { id, url, name, previewToken, updatedAt } = parseShareResult(data);
        const resolvedName = normalizeShareName(name ?? DEFAULT_UNTITLED_SHARE_NAME);
        setActiveShareId(id);
        activeShareIdRef.current = id;
        setActivePreviewToken(previewToken ?? null);
        setActiveShareName(resolvedName);
        setPreviewCacheVersion(toShareCacheVersion(updatedAt));
        syncUrlToShare(id);
        rememberRecent(id, "saved", url, resolvedName);
      } else {
        const res = await fetch(`/api/shares/${encodeURIComponent(existingId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: json,
        });
        const data: unknown = await res.json().catch(() => null);
        if (!res.ok) throw new Error(readApiError(data, "Could not save design."));
        const result = parseShareResult(data);
        if (result.name !== undefined) setActiveShareName(normalizeShareName(result.name));
        if (result.previewToken) setActivePreviewToken(result.previewToken);
        setPreviewCacheVersion(readShareUpdatedAt(result));
        rememberRecent(existingId, "saved", undefined, result.name ?? activeShareName);
      }

      setIsDirty(false);
      markProjectSaved();
    } catch (e) {
      showStatus(e instanceof Error ? e.message : t("autoSaveFailed"), 6000);
      trackStudioError("cloud_save_failed", "other");
    } finally {
      setCloudBusy(false);
      autoSaveInFlightRef.current = false;
      if (autoSaveQueuedRef.current) {
        autoSaveQueuedRef.current = false;
        void autoSaveCloud();
      }
    }
  }, [
    activeShareName,
    buildPersistState,
    ensureCloudAccess,
    rememberRecent,
    showStatus,
    syncUrlToShare,
    viewOnly,
    markProjectSaved,
    t,
  ]);

  const saveCloudAs = useCallback(async () => {
    if (!ensureCloudAccess()) return;
    const nameError = shareNameError(saveAsName);
    if (nameError) {
      setSaveAsNameError(nameError);
      return;
    }

    const normalizedName = normalizeShareName(saveAsName);
    setSaveAsNameError(null);
    setCloudBusy(true);
    setSaveOverlayMessage(t("savingToCloud"));
    setSaveAsLink(null);
    try {
      let preview: ShareOgImageBlob | null = null;
      if (capturePreviewImage) {
        try {
          preview = await capturePreviewImage();
        } catch {
          preview = null;
        }
      }

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
      const { id, url, name, previewUrl, previewToken, updatedAt } = parseShareResult(data);
      const resolvedName = normalizeShareName(name ?? normalizedName);
      setActiveShareId(id);
      setActivePreviewToken(previewToken ?? null);
      setActiveShareName(resolvedName);

      const ogUpdatedAt = await uploadOgPreviewIfPresent(id, preview, setSaveOverlayMessage);
      const cacheVersion = ogUpdatedAt ?? toShareCacheVersion(updatedAt);
      setPreviewCacheVersion(cacheVersion);
      setIsDirty(false);
      rememberRecent(id, "saved", url, resolvedName);
      markProjectSaved();

      if (viewOnly) {
        // Reload so the route re-evaluates ownership and unlocks the full editor.
        window.location.assign(studioSharePath(id));
        return;
      }

      syncUrlToShare(id);
      if (pendingLeaveRef.current) {
        const intent = pendingLeaveRef.current;
        setSaveAsLink(null);
        setSaveAsPreviewLink(null);
        fulfillLeaveRef.current(intent);
        return;
      }
      setSaveAsLink(url);
      setSaveAsPreviewLink(
        previewUrl ??
          (previewToken ? studioPreviewUrl(previewToken, undefined, cacheVersion) : null)
      );
      try {
        await navigator.clipboard.writeText(url);
        showStatus(resolvedName ? t("namedSavedAndLinkCopied", { name: resolvedName }) : t("newShareLinkCreatedAndCopied"));
      } catch {
        showStatus(resolvedName ? t("namedSavedToCloud", { name: resolvedName }) : t("newShareLinkCreated"));
      }
    } catch (e) {
      showStatus(e instanceof Error ? e.message : t("couldNotCreateShareLink"), 6000);
      trackStudioError("cloud_save_failed", "other");
    } finally {
      setSaveOverlayMessage(null);
      setCloudBusy(false);
    }
  }, [buildPersistState, capturePreviewImage, saveAsName, showStatus, syncUrlToShare, rememberRecent, viewOnly, ensureCloudAccess, markProjectSaved, t]);

  const renameCloudShare = useCallback(async () => {
    if (viewOnly || !activeShareId) return;
    if (!ensureCloudAccess()) return;

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
      const result = data as { name?: string | null; updatedAt?: string };
      const resolvedName = normalizeShareName(result.name ?? normalizedName);
      setActiveShareName(resolvedName);
      setPreviewCacheVersion(toShareCacheVersion(result.updatedAt));
      updateRecentDesignName(activeShareId, resolvedName);
      refreshRecentDesigns();
      setModal(null);
      showStatus(resolvedName ? t("renamedTo", { name: resolvedName }) : t("designNameCleared"));
    } catch (e) {
      setRenameError(e instanceof Error ? e.message : t("couldNotRenameDesign"));
    } finally {
      setCloudBusy(false);
    }
  }, [activeShareId, renameInput, showStatus, refreshRecentDesigns, ensureCloudAccess, viewOnly, t]);

  const leavePreviewToEditor = useCallback((shareId: string) => {
    window.location.assign(studioSharePath(shareId));
  }, []);

  const openProject = useCallback(
    async (shareId: string) => {
      if (viewOnly) {
        leavePreviewToEditor(shareId);
        return;
      }
      setModal(null);
      setCloudBusy(true);
      try {
        await loadShareById(shareId, "opened");
        markClean();
        showStatus(t("projectOpened"));
      } catch (e) {
        showStatus(e instanceof Error ? e.message : t("couldNotOpenProject"), 5000);
      } finally {
        setCloudBusy(false);
      }
    },
    [leavePreviewToEditor, loadShareById, markClean, showStatus, viewOnly, t]
  );

  const openFromInput = useCallback(async () => {
    const shareId = parseShareIdFromInput(openInput);
    if (!shareId) {
      setOpenError(t("enterValidShareLink"));
      return;
    }
    if (viewOnly) {
      leavePreviewToEditor(shareId);
      return;
    }
    setOpenError(null);
    setCloudBusy(true);
    try {
      await loadShareById(shareId);
      setModal(null);
      setOpenInput("");
      showStatus(t("designOpenedFromCloud"));
    } catch (e) {
      setOpenError(e instanceof Error ? e.message : t("couldNotOpenDesign"));
    } finally {
      setCloudBusy(false);
    }
  }, [leavePreviewToEditor, loadShareById, openInput, showStatus, viewOnly, t]);

  const openRecentDesign = useCallback(
    async (shareId: string) => {
      if (viewOnly) {
        leavePreviewToEditor(shareId);
        return;
      }
      setCloudBusy(true);
      try {
        await loadShareById(shareId, "opened");
        setModal(null);
        showStatus(t("designOpenedFromRecent"));
      } catch (e) {
        showStatus(e instanceof Error ? e.message : t("couldNotOpenDesign"), 6000);
      } finally {
        setCloudBusy(false);
      }
    },
    [leavePreviewToEditor, loadShareById, showStatus, viewOnly, t]
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
    showStatus(t("recentListCleared"));
  }, [refreshRecentDesigns, showStatus, t]);

  const exportJson = useCallback(async () => {
    const ctx = analyticsCtx();
    trackExportClicked("json", "standard", ctx);
    try {
      const json = await serializeDesign(buildPersistState());
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `3d-box-design-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setModal(null);
      showStatus(t("jsonDownloaded"));
      trackExportCompleted("json", "standard", ctx);
    } catch {
      trackExportFailed("json", "serialization_failed", ctx);
      trackStudioError("export_failed", "export");
      showStatus(t("couldNotExportJson"), 5000);
    }
  }, [buildPersistState, showStatus, analyticsCtx, t]);

  const importJsonFile = useCallback(
    async (file: File) => {
      if (viewOnly) return;
      let text: string;
      try {
        text = await file.text();
      } catch {
        showStatus(t("couldNotReadFile"), 5000);
        return;
      }
      const restored = await deserializeDesign(text);
      if (!restored) {
        showStatus(t("invalidJson"), 6000);
        return;
      }
      applyPersistedState(restored);
      setActiveShareId(null);
      setActivePreviewToken(null);
      setActiveShareName(null);
      setPreviewCacheVersion(null);
      syncUrlToShare(null);
      setIsDirty(true);
      setModal(null);
      showStatus(t("importedDesignFile"));
      onDesignSessionStart?.();
    },
    [applyPersistedState, showStatus, syncUrlToShare, viewOnly, onDesignSessionStart, t]
  );

  const newDocument = useCallback(() => {
    if (viewOnly) return;
    applyPersistedState(defaultBoxDesignerState());
    setActiveShareId(null);
    setActivePreviewToken(null);
    setActiveShareName(null);
    setPreviewCacheVersion(null);
    syncUrlToShare(null);
    setIsDirty(false);
    setModal(null);
    showStatus(t("newDesignStarted"));
    onDesignSessionStart?.();
  }, [applyPersistedState, showStatus, syncUrlToShare, viewOnly, onDesignSessionStart, t]);

  const fulfillLeaveIntent = useCallback(
    (intent: StudioLeaveIntent) => {
      pendingLeaveRef.current = null;
      setPendingLeaveAction(null);
      if (intent === "new") {
        newDocument();
        return;
      }
      if (intent === "open") setOpenError(null);
      setModal(intent);
    },
    [newDocument]
  );
  fulfillLeaveRef.current = fulfillLeaveIntent;

  const requestLeave = useCallback(
    (intent: StudioLeaveIntent) => {
      if (viewOnly) {
        if (intent === "new") {
          window.location.assign("/studio");
          return;
        }
        if (intent === "open") {
          setOpenError(null);
          setModal("open");
          return;
        }
        setModal("recent");
        return;
      }
      if (!isDirty) {
        fulfillLeaveIntent(intent);
        return;
      }
      pendingLeaveRef.current = intent;
      setPendingLeaveAction(intent);
      setModal("unsaved");
    },
    [fulfillLeaveIntent, isDirty, viewOnly]
  );

  const requestNew = useCallback(() => requestLeave("new"), [requestLeave]);
  const requestOpen = useCallback(() => requestLeave("open"), [requestLeave]);
  const requestRecent = useCallback(() => requestLeave("recent"), [requestLeave]);

  const cancelPendingLeave = useCallback(() => {
    pendingLeaveRef.current = null;
    setPendingLeaveAction(null);
    setModal(null);
  }, []);

  const confirmDiscardAndLeave = useCallback(() => {
    const intent = pendingLeaveRef.current;
    if (!intent) {
      setModal(null);
      return;
    }
    fulfillLeaveIntent(intent);
  }, [fulfillLeaveIntent]);

  const confirmSaveAndLeave = useCallback(async () => {
    if (!pendingLeaveRef.current) return;
    if (!activeShareIdRef.current) {
      openSaveAsModal();
      return;
    }
    const saved = await saveCloud();
    if (saved && pendingLeaveRef.current) {
      fulfillLeaveIntent(pendingLeaveRef.current);
    }
  }, [fulfillLeaveIntent, openSaveAsModal, saveCloud]);

  const documentTitle = viewOnly
    ? `${displayShareLabel(activeShareName, null)} · Preview`
    : `${displayShareLabel(activeShareName, activeShareId)}${isDirty ? " •" : ""}`;

  useEffect(() => {
    if (viewOnly || !isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, viewOnly]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "o") {
        e.preventDefault();
        requestOpen();
        return;
      }
      if (viewOnly) return;
      if (key === "s" && e.shiftKey) {
        e.preventDefault();
        openSaveAsModal();
      } else if (key === "s") {
        e.preventDefault();
        void saveCloud();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveCloud, openSaveAsModal, requestOpen, viewOnly]);

  return {
    activeShareId,
    activePreviewToken,
    activeShareName,
    viewOnly,
    isDirty,
    modal,
    setModal,
    statusMessage,
    cloudBusy,
    saveOverlayMessage,
    saveAsLink,
    setSaveAsLink,
    saveAsPreviewLink,
    setSaveAsPreviewLink,
    saveAsName,
    setSaveAsName,
    saveAsNameError,
    setSaveAsNameError,
    saveAsIsCopy,
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
    autoSaveCloud,
    saveCloudAs,
    openSaveAsModal,
    openSaveCopyModal,
    openRenameModal,
    openSharePreviewModal,
    renameCloudShare,
    getPreviewLink,
    getEditorLink,
    copyPreviewLink,
    copyEditorLink,
    openFromInput,
    openProject,
    loadShareById,
    loadShareByPreviewToken,
    openRecentDesign,
    recentDesigns,
    removeRecentDesignEntry,
    clearAllRecentDesigns,
    refreshRecentDesigns,
    exportJson,
    importJsonFile,
    newDocument,
    requestNew,
    requestOpen,
    requestRecent,
    pendingLeaveAction,
    cancelPendingLeave,
    confirmDiscardAndLeave,
    confirmSaveAndLeave,
    showStatus,
    markClean,
  };
}
