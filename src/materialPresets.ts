import type { MaterialPreset } from "./types";

export const MATERIAL_PRESETS: MaterialPreset[] = [
  {
    id: "kraft",
    label: "Kraft paper",
    roughness: 0.92,
    metalness: 0,
    color: "#c4a574",
    envMapIntensity: 0.35,
    clearcoat: 0,
    clearcoatRoughness: 0.5,
  },
  {
    id: "white_card",
    label: "White folding carton",
    roughness: 0.78,
    metalness: 0,
    color: "#f2f0ea",
    envMapIntensity: 0.55,
    clearcoat: 0.08,
    clearcoatRoughness: 0.4,
  },
  {
    id: "gloss_plastic",
    label: "Gloss plastic (PET)",
    roughness: 0.18,
    metalness: 0.05,
    color: "#ffffff",
    envMapIntensity: 1.15,
    clearcoat: 0.85,
    clearcoatRoughness: 0.12,
  },
  {
    id: "matte_plastic",
    label: "Matte plastic",
    roughness: 0.55,
    metalness: 0.02,
    color: "#eaeaea",
    envMapIntensity: 0.65,
    clearcoat: 0.15,
    clearcoatRoughness: 0.55,
  },
  {
    id: "corrugated",
    label: "Corrugated (brown)",
    roughness: 0.95,
    metalness: 0,
    color: "#a08060",
    envMapIntensity: 0.25,
    clearcoat: 0,
    clearcoatRoughness: 0.5,
  },
  {
    id: "metallic_foil",
    label: "Metallic foil",
    roughness: 0.35,
    metalness: 0.65,
    color: "#d4af37",
    envMapIntensity: 1.4,
    clearcoat: 0.45,
    clearcoatRoughness: 0.2,
  },
];

export function getPreset(id: string): MaterialPreset {
  return MATERIAL_PRESETS.find((p) => p.id === id) ?? MATERIAL_PRESETS[0];
}
