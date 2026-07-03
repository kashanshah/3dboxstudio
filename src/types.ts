export type FaceId =
  | "front"
  | "back"
  | "left"
  | "right"
  | "top"
  | "bottom"
  | "topLeft"
  | "topRight";

export const ALL_FACES: FaceId[] = [
  "front",
  "back",
  "left",
  "right",
  "top",
  "bottom",
];

export const SPLIT_TOP_FACES: FaceId[] = ["topLeft", "topRight"];

/** In-plane rotation for artwork on a face (multiples of 90°). */
export type TextureRotationDeg = 0 | 90 | 180 | 270;

/** For split top: which pair of opposite edges the flaps hinge on. */
export type SplitTopHingeSide = "side_a" | "side_b";

export const SPLIT_TOP_HINGE_OPTIONS: { value: SplitTopHingeSide; label: string; hint: string }[] = [
  {
    value: "side_a",
    label: "Side A",
    hint: "Hinges on left & right (−X / +X); flaps are half-width and meet along the centerline parallel to depth.",
  },
  {
    value: "side_b",
    label: "Side B",
    hint: "Hinges on back & front (−Z / +Z); flaps are half-depth and meet along the centerline parallel to width.",
  },
];

export function labelForSplitTopFace(face: "topLeft" | "topRight", hinge: SplitTopHingeSide): string {
  if (hinge === "side_a") {
    return face === "topLeft" ? "Top — left flap (−X half)" : "Top — right flap (+X half)";
  }
  return face === "topLeft" ? "Top — back flap (−Z half)" : "Top — front flap (+Z half)";
}

export type OpeningStyle =
  | "closed"
  | "lid_from_back"
  | "lid_from_front"
  | "lid_from_left"
  | "lid_from_right"
  | "top_split_meet_center"
  | "door_left"
  | "door_right"
  | "double_doors";

export interface BoxDimensions {
  /** Horizontal span (X), packaging width */
  width: number;
  /** Vertical span (Y), packaging height */
  height: number;
  /** Depth along Z, packaging length */
  length: number;
}

export interface MaterialPreset {
  id: string;
  label: string;
  roughness: number;
  metalness: number;
  color: string;
  envMapIntensity: number;
  clearcoat: number;
  clearcoatRoughness: number;
}

export type LengthUnit = "mm" | "cm" | "in";

export const faceLabels: Record<FaceId, string> = {
  front: "Front (+Z)",
  back: "Back (−Z)",
  left: "Left (−X)",
  right: "Right (+X)",
  top: "Top (whole)",
  bottom: "Bottom",
  topLeft: "Top — left flap",
  topRight: "Top — right flap",
};

export function openingRequiresSplitTop(o: OpeningStyle): boolean {
  return o === "top_split_meet_center";
}

export function openingUsesLidFromBack(o: OpeningStyle): boolean {
  return o === "lid_from_back";
}
