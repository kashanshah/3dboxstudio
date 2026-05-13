import { MATERIAL_PRESETS } from "./materialPresets";
import type { BoxDimensions, FaceId, LengthUnit, OpeningStyle, SplitTopHingeSide, TextureRotationDeg } from "./types";

export const BOX_DESIGN_STORAGE_KEY = "3dboxstudio:v1";

const LEGACY_BOX_DESIGN_STORAGE_KEY = "3d-box-designer:v1";

const LENGTH_UNITS: LengthUnit[] = ["mm", "cm", "in"];
const OPENINGS: OpeningStyle[] = ["closed", "lid_from_back", "top_split_meet_center", "door_left"];
const SPLIT_HINGES: SplitTopHingeSide[] = ["side_a", "side_b"];
const ENV_PRESETS = ["studio", "city", "warehouse", "sunset", "dawn"] as const;
export type EnvPreset = (typeof ENV_PRESETS)[number];

const ALL_FACE_IDS: FaceId[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
  "topLeft",
  "topRight",
];

const ROTATION_STEPS: TextureRotationDeg[] = [0, 90, 180, 270];

export interface BoxDesignerPersistedState {
  unit: LengthUnit;
  dims: BoxDimensions;
  faceFiles: Partial<Record<FaceId, File | null>>;
  textureRotationDeg: Partial<Record<FaceId, TextureRotationDeg>>;
  materialId: string;
  opening: OpeningStyle;
  splitTopHingeSide: SplitTopHingeSide;
  openT: number;
  wireframe: boolean;
  showGrid: boolean;
  showAxesGizmo: boolean;
  autoRotate: boolean;
  /** OrbitControls autoRotateSpeed (drei / three.js scale). */
  autoRotateSpeed: number;
  /** When true, auto-rotate runs in the opposite direction (negative speed). */
  autoRotateReverse: boolean;
  /** 0 = closest (max zoom in), 1 = farthest (zoom out). */
  zoomFraction: number;
  envPreset: EnvPreset;
}

export function defaultBoxDesignerState(): BoxDesignerPersistedState {
  return {
    unit: "cm",
    dims: { width: 24, height: 10, length: 16 },
    faceFiles: {},
    textureRotationDeg: {},
    materialId: MATERIAL_PRESETS[0].id,
    opening: "closed",
    splitTopHingeSide: "side_a",
    openT: 0.35,
    wireframe: false,
    showGrid: true,
    showAxesGizmo: true,
    autoRotate: false,
    autoRotateSpeed: 0.65,
    autoRotateReverse: false,
    zoomFraction: 0.5,
    envPreset: "studio",
  };
}

interface PersistedImageEntry {
  name: string;
  mime: string;
  base64: string;
}

interface PersistedJsonV1 {
  v: 1;
  unit: unknown;
  dims: unknown;
  materialId: unknown;
  opening: unknown;
  splitTopHingeSide: unknown;
  openT: unknown;
  wireframe: unknown;
  showGrid: unknown;
  showAxesGizmo: unknown;
  autoRotate: unknown;
  autoRotateSpeed: unknown;
  autoRotateReverse: unknown;
  zoomFraction: unknown;
  envPreset: unknown;
  textureRotationDeg: unknown;
  faceImages: unknown;
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function isLengthUnit(x: unknown): x is LengthUnit {
  return typeof x === "string" && LENGTH_UNITS.includes(x as LengthUnit);
}

function isOpeningStyle(x: unknown): x is OpeningStyle {
  return typeof x === "string" && OPENINGS.includes(x as OpeningStyle);
}

function isSplitTopHingeSide(x: unknown): x is SplitTopHingeSide {
  return typeof x === "string" && SPLIT_HINGES.includes(x as SplitTopHingeSide);
}

function isEnvPreset(x: unknown): x is EnvPreset {
  return typeof x === "string" && (ENV_PRESETS as readonly string[]).includes(x);
}

function isFaceId(x: unknown): x is FaceId {
  return typeof x === "string" && ALL_FACE_IDS.includes(x as FaceId);
}

function isTextureRotationDeg(x: unknown): x is TextureRotationDeg {
  return typeof x === "number" && ROTATION_STEPS.includes(x as TextureRotationDeg);
}

function clampDims(d: unknown): BoxDimensions {
  const def = defaultBoxDesignerState().dims;
  if (!isRecord(d)) return def;
  const num = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };
  return {
    width: num(d.width, def.width),
    height: num(d.height, def.height),
    length: num(d.length, def.length),
  };
}

function validateMaterialId(id: unknown): string {
  if (typeof id !== "string") return MATERIAL_PRESETS[0].id;
  return MATERIAL_PRESETS.some((p) => p.id === id) ? id : MATERIAL_PRESETS[0].id;
}

function parseZoomFraction(raw: unknown): number {
  const def = defaultBoxDesignerState().zoomFraction;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.min(1, Math.max(0, n));
}

function parseAutoRotateSpeed(raw: unknown): number {
  const def = defaultBoxDesignerState().autoRotateSpeed;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return def;
  return Math.min(4, Math.max(0.1, n));
}

function parseTextureRotations(raw: unknown): Partial<Record<FaceId, TextureRotationDeg>> {
  if (!isRecord(raw)) return {};
  const out: Partial<Record<FaceId, TextureRotationDeg>> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!isFaceId(k)) continue;
    const n = typeof v === "number" ? v : Number(v);
    if (isTextureRotationDeg(n)) out[k] = n;
  }
  return out;
}

function fileToPersistedEntry(file: File): Promise<PersistedImageEntry> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = reader.result as string;
      const i = s.indexOf(",");
      const base64 = i >= 0 ? s.slice(i + 1) : s;
      resolve({
        name: file.name,
        mime: file.type || "application/octet-stream",
        base64,
      });
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });
}

async function entryToFile(entry: unknown): Promise<File | null> {
  if (!isRecord(entry)) return null;
  const name = typeof entry.name === "string" ? entry.name : "image";
  const mime = typeof entry.mime === "string" ? entry.mime : "application/octet-stream";
  const base64 = typeof entry.base64 === "string" ? entry.base64 : "";
  if (!base64) return null;
  const dataUrl = `data:${mime};base64,${base64}`;
  try {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], name, { type: mime });
  } catch {
    return null;
  }
}

export async function serializeDesign(state: BoxDesignerPersistedState): Promise<string> {
  const faceImages: Partial<Record<FaceId, PersistedImageEntry>> = {};
  for (const id of ALL_FACE_IDS) {
    const f = state.faceFiles[id];
    if (f) faceImages[id] = await fileToPersistedEntry(f);
  }
  const payload: PersistedJsonV1 = {
    v: 1,
    unit: state.unit,
    dims: state.dims,
    materialId: state.materialId,
    opening: state.opening,
    splitTopHingeSide: state.splitTopHingeSide,
    openT: state.openT,
    wireframe: state.wireframe,
    showGrid: state.showGrid,
    showAxesGizmo: state.showAxesGizmo,
    autoRotate: state.autoRotate,
    autoRotateSpeed: state.autoRotateSpeed,
    autoRotateReverse: state.autoRotateReverse,
    zoomFraction: state.zoomFraction,
    envPreset: state.envPreset,
    textureRotationDeg: state.textureRotationDeg,
    faceImages,
  };
  return JSON.stringify(payload);
}

export async function deserializeDesign(json: string): Promise<BoxDesignerPersistedState | null> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.v !== 1) return null;

  const base = defaultBoxDesignerState();
  const out: BoxDesignerPersistedState = {
    ...base,
    unit: isLengthUnit(parsed.unit) ? parsed.unit : base.unit,
    dims: clampDims(parsed.dims),
    materialId: validateMaterialId(parsed.materialId),
    opening: isOpeningStyle(parsed.opening) ? parsed.opening : base.opening,
    splitTopHingeSide: isSplitTopHingeSide(parsed.splitTopHingeSide) ? parsed.splitTopHingeSide : base.splitTopHingeSide,
    openT:
      typeof parsed.openT === "number" && Number.isFinite(parsed.openT)
        ? Math.min(1, Math.max(0, parsed.openT))
        : base.openT,
    wireframe: typeof parsed.wireframe === "boolean" ? parsed.wireframe : base.wireframe,
    showGrid: typeof parsed.showGrid === "boolean" ? parsed.showGrid : base.showGrid,
    showAxesGizmo: typeof parsed.showAxesGizmo === "boolean" ? parsed.showAxesGizmo : base.showAxesGizmo,
    autoRotate: typeof parsed.autoRotate === "boolean" ? parsed.autoRotate : base.autoRotate,
    autoRotateSpeed: parseAutoRotateSpeed(parsed.autoRotateSpeed),
    autoRotateReverse:
      typeof parsed.autoRotateReverse === "boolean" ? parsed.autoRotateReverse : base.autoRotateReverse,
    zoomFraction: parseZoomFraction(parsed.zoomFraction),
    envPreset: isEnvPreset(parsed.envPreset) ? parsed.envPreset : base.envPreset,
    textureRotationDeg: parseTextureRotations(parsed.textureRotationDeg),
    faceFiles: {},
  };

  const imgs = parsed.faceImages;
  if (isRecord(imgs)) {
    for (const id of ALL_FACE_IDS) {
      const entry = imgs[id];
      if (entry === undefined) continue;
      const file = await entryToFile(entry);
      if (file) out.faceFiles[id] = file;
    }
  }

  return out;
}

export function readDesignFromStorageSync(): string | null {
  try {
    const next = localStorage.getItem(BOX_DESIGN_STORAGE_KEY);
    if (next) return next;
    const legacy = localStorage.getItem(LEGACY_BOX_DESIGN_STORAGE_KEY);
    if (!legacy) return null;
    try {
      localStorage.setItem(BOX_DESIGN_STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_BOX_DESIGN_STORAGE_KEY);
    } catch {
      /* keep legacy if quota blocks dual write */
    }
    return legacy;
  } catch {
    return null;
  }
}

export function writeDesignToStorage(json: string): { ok: true } | { ok: false; message: string } {
  try {
    localStorage.setItem(BOX_DESIGN_STORAGE_KEY, json);
    return { ok: true };
  } catch (e) {
    const msg = e instanceof DOMException && e.name === "QuotaExceededError"
      ? "Browser storage is full. Try smaller images or clear other site data."
      : "Could not save to browser storage.";
    return { ok: false, message: msg };
  }
}

export function clearDesignFromStorage(): void {
  try {
    localStorage.removeItem(BOX_DESIGN_STORAGE_KEY);
    localStorage.removeItem(LEGACY_BOX_DESIGN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
