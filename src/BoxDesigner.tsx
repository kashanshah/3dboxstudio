"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { flushSync } from "react-dom";
import type { RootState } from "@react-three/fiber";
import {
  type BoxDesignerPersistedState,
  type EnvPreset,
} from "./boxDesignPersistence";
import StudioFileModals from "./components/studio/StudioFileModals";
import StudioHelpModals, { type StudioHelpModal } from "./components/studio/StudioHelpModals";
import StudioMenuBar from "./components/studio/StudioMenuBar";
import StudioSaveOverlay from "./components/studio/StudioSaveOverlay";
import StudioStartDialog from "./components/studio/StudioStartDialog";
import StudioProjectsModal from "./components/studio/StudioProjectsModal";
import AuthModal from "./components/auth/AuthModal";
import { useAuth } from "./components/auth/AuthProvider";
import { useStudioDocument } from "./hooks/useStudioDocument";
import { captureCanvasOgBlob } from "./lib/shareOgImage";
import { dismissViewportHint, isViewportHintDismissed } from "./lib/viewportHint";
import { Viewport3D, INITIAL_ZOOM_FRACTION } from "./components/Viewport3D";
import { MATERIAL_PRESETS, getPreset } from "./materialPresets";
import { BOX_TEMPLATES, getBoxTemplate } from "./boxTemplates";
import { useFaceObjectUrls } from "./hooks/useTextures";
import { useViewportRecording } from "./hooks/useViewportRecording";
import type { BoxDimensions, FaceId, LengthUnit, OpeningStyle, SplitTopHingeSide, TextureRotationDeg } from "./types";
import {
  ALL_FACES,
  SPLIT_TOP_FACES,
  SPLIT_TOP_HINGE_OPTIONS,
  faceLabels,
  labelForSplitTopFace,
  openingRequiresSplitTop,
} from "./types";

function toCm(n: number, unit: LengthUnit): number {
  switch (unit) {
    case "mm":
      return n / 10;
    case "cm":
      return n;
    case "in":
      return n * 2.54;
    default:
      return n;
  }
}

const openingOptions: { value: OpeningStyle; label: string; hint: string }[] = [
  { value: "closed", label: "Closed (no motion)", hint: "Rigid box preview" },
  { value: "lid_from_back", label: "Lid from back", hint: "Single top hinged along the back edge" },
  { value: "lid_from_front", label: "Lid from front", hint: "Single top hinged along the front edge" },
  { value: "lid_from_left", label: "Lid from left", hint: "Single top hinged along the left edge" },
  { value: "lid_from_right", label: "Lid from right", hint: "Single top hinged along the right edge" },
  {
    value: "top_split_meet_center",
    label: "Top center — two flaps",
    hint: "Meet in the middle; choose Side A or B for hinge edges, then upload artwork for each half.",
  },
  { value: "door_left", label: "Door opens — left", hint: "Left panel swings from the front-left edge" },
  { value: "door_right", label: "Door opens — right", hint: "Right panel swings from the front-right edge" },
  {
    value: "double_doors",
    label: "Double doors — left & right",
    hint: "Both side panels swing open from their front edges.",
  },
];

const faceArtIconBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0.45rem",
  minWidth: "2.5rem",
};

function IconRotate90() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function IconClearImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconTimes() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function PanelCollapse({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <details
      className="panel-collapse"
      open={open}
      onToggle={(e: SyntheticEvent<HTMLDetailsElement>) => setOpen(e.currentTarget.open)}
    >
      <summary className="panel-collapse-summary">{title}</summary>
      <div className="panel-collapse-body">{children}</div>
    </details>
  );
}

export default function BoxDesigner({
  initialShareId = null,
  initialPreviewToken = null,
  viewOnly = false,
}: {
  initialShareId?: string | null;
  initialPreviewToken?: string | null;
  viewOnly?: boolean;
}) {
  // The studio route may hand us a share id in view-only mode (non-owner opening an
  // editor link), so keep the id even when viewOnly; the preview route uses the token.
  const shareIdFromUrl = initialShareId;
  const previewTokenFromUrl = initialPreviewToken;

  const auth = useAuth();
  const [authModal, setAuthModal] = useState<{ open: boolean; mode: "signin" | "signup" }>({
    open: false,
    mode: "signin",
  });
  const [projectsModalOpen, setProjectsModalOpen] = useState(false);
  const [startDialogOpen, setStartDialogOpen] = useState(
    () => !initialShareId && !initialPreviewToken && !viewOnly
  );
  const [unit, setUnit] = useState<LengthUnit>("cm");
  const [dims, setDims] = useState<BoxDimensions>({ width: 24, height: 10, length: 16 });
  const [boxTemplateId, setBoxTemplateId] = useState("custom");
  const [faceFiles, setFaceFiles] = useState<Partial<Record<FaceId, File | null>>>({});
  const [textureRotationDeg, setTextureRotationDeg] = useState<Partial<Record<FaceId, TextureRotationDeg>>>({});
  const [materialId, setMaterialId] = useState(MATERIAL_PRESETS[0].id);
  const [opening, setOpening] = useState<OpeningStyle>("closed");
  const [splitTopHingeSide, setSplitTopHingeSide] = useState<SplitTopHingeSide>("side_a");
  const [openT, setOpenT] = useState(0.35);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxesGizmo, setShowAxesGizmo] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(0.65);
  const [autoRotateReverse, setAutoRotateReverse] = useState(false);
  const [zoomFraction, setZoomFraction] = useState(INITIAL_ZOOM_FRACTION);
  const [envPreset, setEnvPreset] = useState<EnvPreset>("studio");
  const [sessionReady, setSessionReady] = useState(() => !shareIdFromUrl && !previewTokenFromUrl);
  const [helpModal, setHelpModal] = useState<StudioHelpModal>(null);
  const [showViewportHint, setShowViewportHint] = useState(false);

  useEffect(() => {
    setShowViewportHint(!isViewportHintDismissed());
  }, []);

  const dismissViewportHintOverlay = useCallback(() => {
    dismissViewportHint();
    setShowViewportHint(false);
  }, []);

  const r3fRef = useRef<RootState | null>(null);
  const {
    phase: recordPhase,
    countdown: recordCountdown,
    recordRemainingSec,
    error: recordError,
    start: startViewportRecording,
    stop: stopViewportRecording,
    cancelCountdown: cancelRecordCountdown,
  } = useViewportRecording();

  const isRecordingViewport = recordPhase === "recording";

  const commitOpening = useCallback(
    (value: OpeningStyle) => {
      if (isRecordingViewport) {
        flushSync(() => setOpening(value));
      } else {
        setOpening(value);
      }
      r3fRef.current?.invalidate();
    },
    [isRecordingViewport]
  );

  const commitOpenT = useCallback(
    (value: number) => {
      if (isRecordingViewport) {
        flushSync(() => setOpenT(value));
      } else {
        setOpenT(value);
      }
      r3fRef.current?.invalidate();
    },
    [isRecordingViewport]
  );

  const applyBoxTemplate = useCallback(
    (id: string) => {
      const template = getBoxTemplate(id);
      if (!template) {
        setBoxTemplateId("custom");
        return;
      }
      setUnit(template.unit);
      setDims({ ...template.dims });
      commitOpening(template.opening);
      setBoxTemplateId(template.id);
    },
    [commitOpening]
  );

  const editDims = useCallback((patch: Partial<BoxDimensions>) => {
    setDims((d) => ({ ...d, ...patch }));
    setBoxTemplateId("custom");
  }, []);

  const textureUrls = useFaceObjectUrls(faceFiles);

  const sceneDims = useMemo(
    () => ({
      width: toCm(dims.width, unit),
      height: toCm(dims.height, unit),
      length: toCm(dims.length, unit),
    }),
    [dims, unit]
  );

  const preset = useMemo(() => getPreset(materialId), [materialId]);

  const splitTop = openingRequiresSplitTop(opening);

  const textures = useMemo(() => {
    const out: Partial<Record<FaceId, string | null>> = {};
    (Object.keys(textureUrls) as FaceId[]).forEach((k) => {
      const u = textureUrls[k];
      if (u) out[k] = u;
    });
    return out;
  }, [textureUrls]);

  const buildPersistState = useCallback((): BoxDesignerPersistedState => {
    return {
      unit,
      dims,
      faceFiles,
      textureRotationDeg,
      materialId,
      opening,
      splitTopHingeSide,
      openT,
      wireframe,
      showGrid,
      showAxesGizmo,
      autoRotate,
      autoRotateSpeed,
      autoRotateReverse,
      zoomFraction,
      envPreset,
    };
  }, [
    unit,
    dims,
    faceFiles,
    textureRotationDeg,
    materialId,
    opening,
    splitTopHingeSide,
    openT,
    wireframe,
    showGrid,
    showAxesGizmo,
    autoRotate,
    autoRotateSpeed,
    autoRotateReverse,
    zoomFraction,
    envPreset,
  ]);

  const applyPersistedState = useCallback((restored: BoxDesignerPersistedState) => {
    setUnit(restored.unit);
    setDims(restored.dims);
    setBoxTemplateId("custom");
    setFaceFiles(restored.faceFiles);
    setTextureRotationDeg(restored.textureRotationDeg);
    setMaterialId(restored.materialId);
    setOpening(restored.opening);
    setSplitTopHingeSide(restored.splitTopHingeSide);
    setOpenT(restored.openT);
    setWireframe(restored.wireframe);
    setShowGrid(restored.showGrid);
    setShowAxesGizmo(restored.showAxesGizmo);
    setAutoRotate(restored.autoRotate);
    setAutoRotateSpeed(restored.autoRotateSpeed);
    setAutoRotateReverse(restored.autoRotateReverse);
    // Re-frame to the standard initial zoom on every load so the box is consistently framed
    // for the restored dimensions (avoids inheriting a stale, over-zoomed saved value).
    setZoomFraction(INITIAL_ZOOM_FRACTION);
    setEnvPreset(restored.envPreset);
  }, []);

  const capturePreviewImage = useCallback(async () => {
    const s = r3fRef.current;
    if (!s?.gl || !s.camera) return null;
    s.gl.render(s.scene, s.camera);
    return captureCanvasOgBlob(s.gl.domElement);
  }, []);

  const openSignIn = useCallback(() => setAuthModal({ open: true, mode: "signin" }), []);
  const openSignUp = useCallback(() => setAuthModal({ open: true, mode: "signup" }), []);

  const doc = useStudioDocument({
    buildPersistState,
    applyPersistedState,
    initialShareId: shareIdFromUrl,
    sessionReady,
    viewOnly,
    capturePreviewImage,
    authUser: auth.user,
    onRequireSignIn: openSignIn,
  });

  const openProjects = useCallback(() => {
    if (!auth.user) {
      openSignIn();
      return;
    }
    setProjectsModalOpen(true);
  }, [auth.user, openSignIn]);

  const handleOpenProject = useCallback(
    (id: string) => {
      setProjectsModalOpen(false);
      setStartDialogOpen(false);
      void doc.openProject(id);
    },
    [doc]
  );

  const handleSignOut = useCallback(() => {
    void auth.signOut();
  }, [auth]);

  const resendVerification = useCallback(async () => {
    const result = await auth.resendVerification();
    doc.showStatus(result.ok ? "Verification email sent. Check your inbox." : result.error, 6000);
  }, [auth, doc]);

  useEffect(() => {
    if (!shareIdFromUrl) return;

    let cancelled = false;

    void (async () => {
      try {
        await doc.loadShareById(shareIdFromUrl);
        if (!cancelled) doc.showStatus("Opened shared design from link.");
      } catch {
        if (!cancelled) doc.showStatus("Could not load shared design.", 5000);
      } finally {
        if (!cancelled) {
          setSessionReady(true);
          doc.markClean();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [shareIdFromUrl, doc.loadShareById, doc.showStatus, doc.markClean]);

  useEffect(() => {
    if (!previewTokenFromUrl) return;

    let cancelled = false;

    void (async () => {
      try {
        await doc.loadShareByPreviewToken(previewTokenFromUrl);
        if (!cancelled) doc.showStatus("View-only preview opened.");
      } catch {
        if (!cancelled) doc.showStatus("Could not load preview.", 5000);
      } finally {
        if (!cancelled) {
          setSessionReady(true);
          doc.markClean();
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [previewTokenFromUrl, doc.loadShareByPreviewToken, doc.showStatus, doc.markClean]);

  const setZoomFractionClamped = useCallback((t: number) => {
    setZoomFraction(Math.min(1, Math.max(0, t)));
  }, []);

  const setFile = useCallback((id: FaceId, file: File | null) => {
    setFaceFiles((prev) => ({ ...prev, [id]: file }));
    if (!file) {
      setTextureRotationDeg((prev) => {
        const { [id]: _removed, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  const bumpTextureRotationBy90 = useCallback((id: FaceId) => {
    setTextureRotationDeg((prev) => {
      const cur = prev[id] ?? 0;
      const next = ((cur + 90) % 360) as TextureRotationDeg;
      if (next === 0) {
        const { [id]: _r, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: next };
    });
  }, []);

  const clearAllTextures = useCallback(() => {
    setFaceFiles({});
    setTextureRotationDeg({});
  }, []);

  const applyOneToAll = useCallback(
    (id: FaceId) => {
      const f = faceFiles[id];
      if (!f) return;
      const next: Partial<Record<FaceId, File | null>> = {};
      const targets: FaceId[] = splitTop ? [...ALL_FACES.filter((x) => x !== "top"), ...SPLIT_TOP_FACES] : ALL_FACES;
      targets.forEach((k) => {
        next[k] = f;
      });
      setFaceFiles((prev) => ({ ...prev, ...next }));
      const rot = textureRotationDeg[id] ?? 0;
      setTextureRotationDeg((prev) => {
        const merged = { ...prev };
        targets.forEach((k) => {
          if (rot === 0) {
            delete merged[k];
          } else {
            merged[k] = rot as TextureRotationDeg;
          }
        });
        return merged;
      });
    },
    [faceFiles, splitTop, textureRotationDeg]
  );

  const exportPng = useCallback(() => {
    const s = r3fRef.current;
    if (!s?.gl || !s.camera) return;
    s.gl.render(s.scene, s.camera);
    const url = s.gl.domElement.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `box-preview-${Date.now()}.png`;
    a.click();
  }, []);

  const getPreviewCanvas = useCallback(() => r3fRef.current?.gl.domElement ?? null, []);

  const startPresentationRecording = useCallback(() => {
    startViewportRecording(getPreviewCanvas);
  }, [startViewportRecording, getPreviewCanvas]);

  const dimHint = `Scene units: centimeters (converted from ${unit})`;
  const openingLabel = openingOptions.find((o) => o.value === opening)?.label ?? opening;

  return (
    <div className="studio-workspace">
      {doc.saveOverlayMessage && <StudioSaveOverlay message={doc.saveOverlayMessage} />}
      <StudioMenuBar
        documentTitle={doc.documentTitle}
        cloudBusy={doc.cloudBusy}
        viewOnly={doc.viewOnly}
        user={auth.user}
        onOpenModal={doc.setModal}
        onOpenHelpModal={setHelpModal}
        onSave={() => void doc.saveCloud()}
        onSaveAs={doc.openSaveAsModal}
        onRename={doc.openRenameModal}
        canRename={Boolean(doc.activeShareId)}
        canSharePreview={Boolean(doc.activePreviewToken)}
        onSharePreview={doc.openSharePreviewModal}
        onCopyPreviewLink={() => void doc.copyPreviewLink()}
        onNew={doc.requestNew}
        onSignIn={openSignIn}
        onSignUp={openSignUp}
        onSignOut={handleSignOut}
        onOpenProjects={openProjects}
      />
      {doc.viewOnly && (
        <div className="studio-preview-banner" role="status">
          View-only preview — explore the design and export PNGs. Editing is not available from this link.
        </div>
      )}
      {!doc.viewOnly && auth.user && !auth.user.emailVerified && (
        <div className="studio-verify-banner" role="status">
          <span>
            Verify your email (<strong>{auth.user.email}</strong>) to save and share your projects.
          </span>
          <button type="button" className="studio-verify-resend" onClick={() => void resendVerification()}>
            Resend email
          </button>
        </div>
      )}
      {doc.statusMessage && (
        <div className="studio-status-banner" role="status">
          {doc.statusMessage}
        </div>
      )}
      <div className="box-designer-root">
      <div
        style={{
          position: "relative",
          borderRight: "1px solid var(--panel-border)",
          background: "linear-gradient(165deg, #0a0d14 0%, #0c1018 45%, #0a0c10 100%)",
        }}
      >
        <Viewport3D
          width={sceneDims.width}
          height={sceneDims.height}
          length={sceneDims.length}
          textures={textures}
          splitTop={splitTop}
          splitTopHingeSide={splitTopHingeSide}
          preset={preset}
          opening={opening}
          openT={openT}
          wireframe={wireframe}
          showGrid={showGrid}
          showAxesGizmo={showAxesGizmo}
          autoRotate={autoRotate}
          autoRotateSpeed={autoRotateSpeed}
          autoRotateReverse={autoRotateReverse}
          zoomFraction={zoomFraction}
          onZoomFractionChange={setZoomFractionClamped}
          envPreset={envPreset}
          textureRotationDeg={textureRotationDeg}
          snappyOrbit={recordPhase === "recording"}
          recordingActive={recordPhase === "recording"}
          cleanCapture={recordPhase === "recording"}
          onCanvasReady={(state) => {
            r3fRef.current = state;
          }}
        />
        {recordPhase === "countdown" && recordCountdown !== null && (
          <div
            role="status"
            aria-live="assertive"
            style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(6, 8, 12, 0.55)",
              zIndex: 6,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                fontSize: "clamp(4rem, 18vw, 7rem)",
                fontWeight: 800,
                lineHeight: 1,
                color: "#f8fafc",
                textShadow: "0 0 40px rgba(59, 130, 246, 0.45)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {recordCountdown}
            </span>
          </div>
        )}
        {recordPhase === "recording" && (
          <div
            style={{
              position: "absolute",
              top: 14,
              left: 14,
              zIndex: 6,
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 12px",
              borderRadius: "var(--radius)",
              background: "rgba(127, 29, 29, 0.88)",
              border: "1px solid rgba(252, 165, 165, 0.5)",
              color: "#fef2f2",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.06em",
              pointerEvents: "none",
            }}
          >
            <span
              aria-hidden
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: "#fecaca",
                boxShadow: "0 0 0 2px rgba(254, 202, 202, 0.5)",
                animation: "viewport-rec-pulse 1.1s ease-in-out infinite",
              }}
            />
            REC
            {recordRemainingSec !== null && (
              <span style={{ opacity: 0.95, fontVariantNumeric: "tabular-nums" }}>
                · {recordRemainingSec}s
              </span>
            )}
          </div>
        )}
        {showViewportHint && (
          <div className="viewport-hint" role="note">
            <p className="viewport-hint-text">
              Drag to orbit · Scroll to zoom · Right-drag to pan. Inspired by packaging configurators — this is a
              lightweight structural + artwork preview (not a full CAD die-line engine).
            </p>
            <button
              type="button"
              className="viewport-hint-close"
              onClick={dismissViewportHintOverlay}
              aria-label="Dismiss viewport hint"
              title="Dismiss for 24 hours"
            >
              <IconTimes />
            </button>
          </div>
        )}
      </div>

      <aside
        style={{
          overflowY: "auto",
          padding: "1.1rem 1.15rem 2rem",
          background: "var(--panel)",
          borderLeft: "1px solid var(--panel-border)",
        }}
      >
        <header style={{ marginBottom: "1.25rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 700, letterSpacing: "-0.02em" }}>3D Box Studio</h1>
          <p style={{ margin: "0.35rem 0 0", color: "var(--muted)", fontSize: "0.88rem" }}>
            {viewOnly
              ? "Client preview mode — orbit the box, adjust lighting, and export PNGs or a short video."
              : "Dimensions, materials, openings, and per-face artwork. Use File for open, save, and import/export."}
          </p>
          {!viewOnly && (
            <p style={{ margin: "0.5rem 0 0", fontSize: "0.75rem", color: "var(--muted)" }}>
              {doc.activeShareId ? (
                <>
                  Cloud share · <span className="dim-badge">{doc.activeShareId}</span>
                  {doc.isDirty ? " · unsaved changes" : " · saved"}
                </>
              ) : (
                <>Use File → Save or Save As to upload this design and get share links.</>
              )}
            </p>
          )}
        </header>

        {viewOnly ? (
          <>
          <PanelCollapse title="Design summary">
            <dl className="studio-preview-summary">
              <div>
                <dt>Name</dt>
                <dd>{doc.activeShareName ?? "Untitled design"}</dd>
              </div>
              <div>
                <dt>Dimensions</dt>
                <dd>
                  {dims.width} × {dims.height} × {dims.length} {unit}
                </dd>
              </div>
              <div>
                <dt>Material</dt>
                <dd>{preset.label}</dd>
              </div>
              <div>
                <dt>Opening</dt>
                <dd>{openingLabel}</dd>
              </div>
            </dl>
          </PanelCollapse>
          {opening !== "closed" && (
            <PanelCollapse title="Presentation">
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 0.65rem" }}>
                Drag the slider to show how the box opens — useful for client walkthroughs.
              </p>
              <label>Open amount ({Math.round(openT * 100)}%)</label>
              <input type="range" min={0} max={1} step={0.01} value={openT} onChange={(e) => commitOpenT(Number(e.target.value))} />
            </PanelCollapse>
          )}
          </>
        ) : (
          <>
        <PanelCollapse title="Outer dimensions">
          <div style={{ marginBottom: "0.65rem" }}>
            <label>Box template</label>
            <select value={boxTemplateId} onChange={(e) => applyBoxTemplate(e.target.value)}>
              <option value="custom">Custom (manual)</option>
              {BOX_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.45rem 0 0" }}>
              {getBoxTemplate(boxTemplateId)?.hint ?? "Start from a common box size, then fine-tune below."}
            </p>
          </div>
          <div style={{ marginBottom: "0.65rem" }}>
            <label>Unit</label>
            <select value={unit} onChange={(e) => setUnit(e.target.value as LengthUnit)}>
              <option value="mm">Millimeters (mm)</option>
              <option value="cm">Centimeters (cm)</option>
              <option value="in">Inches (in)</option>
            </select>
          </div>
          <div className="row-3">
            <div>
              <label>Width</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={dims.width}
                onChange={(e) => editDims({ width: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label>Height</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={dims.height}
                onChange={(e) => editDims({ height: Number(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label>Length (depth)</label>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={dims.length}
                onChange={(e) => editDims({ length: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="dim-badge">{dimHint}</div>
        </PanelCollapse>

        <PanelCollapse title="Board / material">
          <label>Preset</label>
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)}>
            {MATERIAL_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "0.5rem" }}>
            PBR-style response (roughness, clearcoat, metalness). Drop your own substrate by swapping presets in code.
          </p>
        </PanelCollapse>

        <PanelCollapse title="Opening style">
          <label>Mechanism</label>
          <select value={opening} onChange={(e) => commitOpening(e.target.value as OpeningStyle)}>
            {openingOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.45rem 0 0" }}>
            {openingOptions.find((o) => o.value === opening)?.hint}
          </p>
          {opening === "top_split_meet_center" && (
            <div style={{ marginTop: "0.75rem" }}>
              <label>Split top — hinge pair</label>
              <select value={splitTopHingeSide} onChange={(e) => setSplitTopHingeSide(e.target.value as SplitTopHingeSide)}>
                {SPLIT_TOP_HINGE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0.45rem 0 0" }}>
                {SPLIT_TOP_HINGE_OPTIONS.find((o) => o.value === splitTopHingeSide)?.hint}
              </p>
            </div>
          )}
          {opening !== "closed" && (
            <div style={{ marginTop: "0.75rem" }}>
              <label>Open amount ({Math.round(openT * 100)}%)</label>
              <input type="range" min={0} max={1} step={0.01} value={openT} onChange={(e) => commitOpenT(Number(e.target.value))} />
            </div>
          )}
        </PanelCollapse>

        <PanelCollapse title="Face artwork">
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 0.65rem" }}>
            PNG or JPG recommended. Art is UV-stretched to each rectangle; for print-ready proofs, design to the flat dieline
            first, then preview here. Hover the rotate and clear icons beside each face for hints; rotation advances 90° per
            click.
          </p>
          {(splitTop ? [...ALL_FACES.filter((f) => f !== "top"), ...SPLIT_TOP_FACES] : ALL_FACES).map((fid) => (
            <div key={fid} style={{ marginBottom: "0.65rem" }}>
              <label>
                {fid === "topLeft" || fid === "topRight" ? labelForSplitTopFace(fid, splitTopHingeSide) : faceLabels[fid]}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(fid, e.target.files?.[0] ?? null)}
                style={{ width: "100%", marginBottom: 6 }}
              />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={faceArtIconBtn}
                  onClick={() => bumpTextureRotationBy90(fid)}
                  title="Rotate artwork 90° on this face"
                  aria-label="Rotate artwork 90 degrees on this face"
                >
                  <IconRotate90 />
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={faceArtIconBtn}
                  onClick={() => setFile(fid, null)}
                  disabled={!faceFiles[fid]}
                  title="Remove image from this face"
                  aria-label="Remove image from this face"
                >
                  <IconClearImage />
                </button>
                <span className="dim-badge" style={{ marginLeft: "auto", marginTop: 0 }}>
                  {(textureRotationDeg[fid] ?? 0) === 0 ? "0°" : `${textureRotationDeg[fid]}°`}
                </span>
              </div>
              {faceFiles[fid] && (
                <button type="button" className="btn" style={{ marginTop: 6, width: "100%" }} onClick={() => applyOneToAll(fid)}>
                  Use this image for all faces
                </button>
              )}
            </div>
          ))}
          <div style={{ marginTop: "0.5rem" }}>
            <button type="button" className="btn" style={{ width: "100%" }} onClick={clearAllTextures}>
              Clear all artwork
            </button>
          </div>
        </PanelCollapse>
          </>
        )}

        <PanelCollapse title="Viewport capture">
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 0.65rem" }}>
            <strong style={{ color: "var(--text)", fontWeight: 600 }}>Export & record.</strong> PNG is a still of the 3D
            preview on the left (not this panel). Video records that same viewport: after a 3-second countdown, capture runs up
            to 15 seconds while you change options in the sidebar; you can stop early. A one-second end card credits{" "}
            <strong style={{ color: "var(--text)", fontWeight: 600 }}>www.3dboxstudio.com</strong>. Output is MP4 when your
            browser supports it, otherwise WebM.
          </p>
          {recordPhase === "recording" ? (
            <>
              <div style={{ marginBottom: "0.5rem" }}>
                <button
                  type="button"
                  className="btn"
                  onClick={stopViewportRecording}
                  style={{ width: "100%", borderColor: "#b91c1c", color: "#fecaca" }}
                >
                  Stop & download video
                </button>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <button type="button" className="btn" onClick={exportPng} style={{ width: "100%" }}>
                  Export viewport PNG
                </button>
              </div>
            </>
          ) : recordPhase === "countdown" ? (
            <>
              <div className="row-2" style={{ marginBottom: "0.5rem" }}>
                <button type="button" className="btn btn-ghost" onClick={cancelRecordCountdown}>
                  Cancel countdown
                </button>
                <span className="dim-badge" style={{ marginTop: 0, alignSelf: "center" }}>
                  Starting in {recordCountdown}…
                </span>
              </div>
              <div style={{ marginBottom: "0.75rem" }}>
                <button type="button" className="btn" onClick={exportPng} style={{ width: "100%" }}>
                  Export viewport PNG
                </button>
              </div>
            </>
          ) : (
            <div className="row-1" style={{ marginBottom: "0.75rem" }}>
              <button type="button" className="btn btn-primary" onClick={startPresentationRecording}>
                Record presentation (15s)
              </button>
              <button type="button" className="btn" onClick={exportPng}>
                Export viewport PNG
              </button>
            </div>
          )}
          {recordError && (
            <p style={{ fontSize: "0.8rem", color: "#fca5a5", margin: "0 0 0.65rem" }} role="alert">
              {recordError}
            </p>
          )}
        </PanelCollapse>

        <PanelCollapse title="Viewport & lighting">
          <p style={{ fontSize: "0.8rem", color: "var(--muted)", margin: "0 0 0.65rem" }}>
            HDRI lighting, camera zoom, and how the preview is drawn (grid, gizmo, wireframe, turntable).
          </p>
          <label>HDRI preset</label>
          <select value={envPreset} onChange={(e) => setEnvPreset(e.target.value as EnvPreset)}>
            <option value="studio">Studio</option>
            <option value="city">City</option>
            <option value="warehouse">Warehouse</option>
            <option value="sunset">Sunset</option>
            <option value="dawn">Dawn</option>
          </select>
          <div style={{ marginTop: "0.75rem" }}>
            <label>Zoom</label>
            <p style={{ fontSize: "0.75rem", color: "var(--muted)", margin: "0.25rem 0 0.4rem" }}>
              Scroll or pinch on the viewport still zooms; the slider stays in sync with camera distance.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 2 }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.35rem 0.55rem", minWidth: "2.25rem" }}
                title="Zoom out (camera farther)"
                aria-label="Zoom out"
                onClick={() =>
                  setZoomFraction((z) => Math.min(1, Math.round((z + 0.04) * 1000) / 1000))
                }
              >
                −
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.005}
                value={zoomFraction}
                onChange={(e) => setZoomFraction(Number(e.target.value))}
                style={{ flex: 1 }}
                aria-valuemin={0}
                aria-valuemax={1}
                aria-valuenow={zoomFraction}
                aria-label="Zoom level"
              />
              <button
                type="button"
                className="btn btn-ghost"
                style={{ padding: "0.35rem 0.55rem", minWidth: "2.25rem" }}
                title="Zoom in (camera closer)"
                aria-label="Zoom in"
                onClick={() =>
                  setZoomFraction((z) => Math.max(0, Math.round((z - 0.04) * 1000) / 1000))
                }
              >
                +
              </button>
            </div>
          </div>
          <div style={{ marginTop: "0.75rem" }}>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={wireframe} onChange={(e) => setWireframe(e.target.checked)} />
              Wireframe overlay
            </label>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
              Floor grid
            </label>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={showAxesGizmo} onChange={(e) => setShowAxesGizmo(e.target.checked)} />
              Orientation gizmo
            </label>
            <label className="checkbox-row" style={{ marginBottom: 0 }}>
              <input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} />
              Auto-rotate (turntable)
            </label>
            {autoRotate && (
              <div style={{ marginTop: "0.65rem", paddingLeft: "1.5rem" }}>
                <label>Auto-rotate speed ({autoRotateSpeed.toFixed(2)})</label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.35rem 0.55rem", minWidth: "2.25rem" }}
                    title="Decrease speed"
                    aria-label="Decrease auto-rotate speed"
                    onClick={() =>
                      setAutoRotateSpeed((s) => Math.max(0.1, Math.round((s - 0.1) * 100) / 100))
                    }
                  >
                    −
                  </button>
                  <input
                    type="range"
                    min={0.1}
                    max={4}
                    step={0.05}
                    value={autoRotateSpeed}
                    onChange={(e) => setAutoRotateSpeed(Number(e.target.value))}
                    style={{ flex: 1 }}
                    aria-valuemin={0.1}
                    aria-valuemax={4}
                    aria-valuenow={autoRotateSpeed}
                  />
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ padding: "0.35rem 0.55rem", minWidth: "2.25rem" }}
                    title="Increase speed"
                    aria-label="Increase auto-rotate speed"
                    onClick={() =>
                      setAutoRotateSpeed((s) => Math.min(4, Math.round((s + 0.1) * 100) / 100))
                    }
                  >
                    +
                  </button>
                </div>
                <label className="checkbox-row" style={{ marginTop: "0.6rem", marginBottom: 0 }} title="Spin the turntable the other way">
                  <input
                    type="checkbox"
                    checked={autoRotateReverse}
                    onChange={(e) => setAutoRotateReverse(e.target.checked)}
                  />
                  Reverse direction
                </label>
              </div>
            )}
          </div>
        </PanelCollapse>
      </aside>
      </div>
      <StudioFileModals doc={doc} />
      <StudioHelpModals modal={helpModal} onClose={() => setHelpModal(null)} onStatus={doc.showStatus} />
      <StudioStartDialog
        open={startDialogOpen && !viewOnly}
        user={auth.user}
        onClose={() => setStartDialogOpen(false)}
        onCreateNew={() => setStartDialogOpen(false)}
        onOpenProject={() => {
          setStartDialogOpen(false);
          openProjects();
        }}
        onImport={() => {
          setStartDialogOpen(false);
          doc.setModal("import");
        }}
      />
      <StudioProjectsModal
        open={projectsModalOpen}
        onClose={() => setProjectsModalOpen(false)}
        onOpenProject={handleOpenProject}
        onStatus={doc.showStatus}
      />
      <AuthModal
        open={authModal.open}
        initialMode={authModal.mode}
        onClose={() => setAuthModal((s) => ({ ...s, open: false }))}
        onSuccess={() => auth.refresh()}
      />
    </div>
  );
}
