import type { FaceId } from "@/types";
import { getFaceAspectRatio, type FaceSizeContext } from "@/lib/faceAspectRatio";
import {
  coverCropPercent,
  createSideImagePlacement,
  defaultZoom,
  type SideImagePlacement,
} from "@/lib/faceImageCrop";
import type { SourceImageRecord } from "@/lib/sourceImages";

export type FaceArtworkState = {
  sourceImages: Record<string, SourceImageRecord>;
  faceFiles: Partial<Record<FaceId, File | null>>;
  faceImagePlacements: Partial<Record<FaceId, SideImagePlacement>>;
};

export function emptyFaceArtworkState(): FaceArtworkState {
  return {
    sourceImages: {},
    faceFiles: {},
    faceImagePlacements: {},
  };
}

export function referencedSourceIds(state: Pick<FaceArtworkState, "faceImagePlacements">): Set<string> {
  const ids = new Set<string>();
  for (const placement of Object.values(state.faceImagePlacements)) {
    if (placement?.sourceImageId) ids.add(placement.sourceImageId);
  }
  return ids;
}

export function pruneUnreferencedSources(state: FaceArtworkState): FaceArtworkState {
  const used = referencedSourceIds(state);
  const sourceImages: Record<string, SourceImageRecord> = {};
  for (const [id, source] of Object.entries(state.sourceImages)) {
    const fileStillAssigned = Object.values(state.faceFiles).some((file) => file === source.file);
    if (used.has(id) || fileStillAssigned) {
      sourceImages[id] = source;
    }
  }
  return { ...state, sourceImages };
}

export function addSourceImage(state: FaceArtworkState, source: SourceImageRecord): FaceArtworkState {
  if (state.sourceImages[source.id] === source) return state;
  return {
    ...state,
    sourceImages: { ...state.sourceImages, [source.id]: source },
  };
}

export function applyFaceCrop(
  state: FaceArtworkState,
  faceId: FaceId,
  source: SourceImageRecord,
  placement: SideImagePlacement
): FaceArtworkState {
  const nextPlacement: SideImagePlacement = {
    ...placement,
    sourceImageId: source.id,
  };
  return pruneUnreferencedSources({
    sourceImages: { ...state.sourceImages, [source.id]: source },
    faceFiles: { ...state.faceFiles, [faceId]: source.file },
    faceImagePlacements: { ...state.faceImagePlacements, [faceId]: nextPlacement },
  });
}

export function clearFaceArtwork(state: FaceArtworkState, faceId: FaceId): FaceArtworkState {
  const faceFiles = { ...state.faceFiles };
  delete faceFiles[faceId];
  const faceImagePlacements = { ...state.faceImagePlacements };
  delete faceImagePlacements[faceId];
  return pruneUnreferencedSources({
    sourceImages: state.sourceImages,
    faceFiles,
    faceImagePlacements,
  });
}

export function clearAllFaceArtwork(): FaceArtworkState {
  return emptyFaceArtworkState();
}

export function defaultPlacementForSource(
  source: SourceImageRecord,
  faceId: FaceId,
  sizeCtx: FaceSizeContext
): SideImagePlacement {
  const aspectRatio = getFaceAspectRatio(faceId, sizeCtx);
  return createSideImagePlacement(
    source.id,
    coverCropPercent(source.naturalWidth, source.naturalHeight, aspectRatio),
    aspectRatio,
    defaultZoom(),
    0
  );
}

export function applySourceToFaces(
  state: FaceArtworkState,
  source: SourceImageRecord,
  faceIds: FaceId[],
  sizeCtx: FaceSizeContext,
  sourceFaceId?: FaceId
): FaceArtworkState {
  let next: FaceArtworkState = addSourceImage(state, source);
  const existing =
    sourceFaceId && next.faceImagePlacements[sourceFaceId]?.sourceImageId === source.id
      ? next.faceImagePlacements[sourceFaceId]
      : undefined;
  const sharedPlacement = sourceFaceId
    ? existing ?? defaultPlacementForSource(source, sourceFaceId, sizeCtx)
    : undefined;

  for (const faceId of faceIds) {
    next = applyFaceCrop(
      next,
      faceId,
      source,
      sharedPlacement ?? defaultPlacementForSource(source, faceId, sizeCtx)
    );
  }
  return next;
}

export function sourceForFace(
  state: FaceArtworkState,
  faceId: FaceId
): SourceImageRecord | null {
  const placement = state.faceImagePlacements[faceId];
  if (placement?.sourceImageId && state.sourceImages[placement.sourceImageId]) {
    return state.sourceImages[placement.sourceImageId];
  }
  const file = state.faceFiles[faceId];
  if (!file) return null;
  return Object.values(state.sourceImages).find((source) => source.file === file) ?? null;
}

export function resolveFaceSourceFile(
  state: Pick<FaceArtworkState, "sourceImages" | "faceFiles" | "faceImagePlacements">,
  faceId: FaceId
): File | null {
  const placement = state.faceImagePlacements[faceId];
  if (placement?.sourceImageId) {
    const source = state.sourceImages[placement.sourceImageId];
    if (source?.file) return source.file;
    return null;
  }
  return state.faceFiles[faceId] ?? null;
}

export function artworkPersistencePlan(state: FaceArtworkState): {
  sourceIds: string[];
  placedFaces: FaceId[];
  legacyFaces: FaceId[];
} {
  const placedFaces = (Object.keys(state.faceImagePlacements) as FaceId[]).filter((id) => {
    const placement = state.faceImagePlacements[id];
    return Boolean(placement && state.sourceImages[placement.sourceImageId]);
  });
  const sourceIds = [
    ...new Set(placedFaces.map((id) => state.faceImagePlacements[id]!.sourceImageId)),
  ];
  const legacyFaces = (Object.keys(state.faceFiles) as FaceId[]).filter(
    (id) => Boolean(state.faceFiles[id]) && !placedFaces.includes(id)
  );
  return { sourceIds, placedFaces, legacyFaces };
}

export function changingOneFaceLeavesOthersUnchanged(
  before: FaceArtworkState,
  after: FaceArtworkState,
  editedFace: FaceId
): boolean {
  const faces = new Set([
    ...Object.keys(before.faceImagePlacements),
    ...Object.keys(after.faceImagePlacements),
    ...Object.keys(before.faceFiles),
    ...Object.keys(after.faceFiles),
  ]) as Set<FaceId>;

  for (const faceId of faces) {
    if (faceId === editedFace) continue;
    if (before.faceFiles[faceId] !== after.faceFiles[faceId]) return false;
    const prev = before.faceImagePlacements[faceId];
    const next = after.faceImagePlacements[faceId];
    if (prev === next) continue;
    if (!prev || !next) return false;
    if (
      prev.sourceImageId !== next.sourceImageId ||
      prev.zoom !== next.zoom ||
      prev.aspectRatio !== next.aspectRatio ||
      (prev.rotation ?? 0) !== (next.rotation ?? 0) ||
      prev.crop.x !== next.crop.x ||
      prev.crop.y !== next.crop.y ||
      prev.crop.width !== next.crop.width ||
      prev.crop.height !== next.crop.height
    ) {
      return false;
    }
  }
  return true;
}
