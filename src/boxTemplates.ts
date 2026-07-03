import type { BoxDimensions, LengthUnit, OpeningStyle } from "./types";

export interface BoxTemplate {
  id: string;
  label: string;
  unit: LengthUnit;
  dims: BoxDimensions;
  opening: OpeningStyle;
  hint: string;
}

/** Ready-made box proportions. Selecting one sets the unit, dimensions, and a suggested opening. */
export const BOX_TEMPLATES: BoxTemplate[] = [
  {
    id: "mailer",
    label: "Mailer / shipping box",
    unit: "cm",
    dims: { width: 30, height: 8, length: 22 },
    opening: "lid_from_back",
    hint: "Roll-end mailer with a front-lift lid.",
  },
  {
    id: "cube",
    label: "Cube",
    unit: "cm",
    dims: { width: 18, height: 18, length: 18 },
    opening: "top_split_meet_center",
    hint: "Regular cube with center-meeting top flaps.",
  },
  {
    id: "shipping_carton",
    label: "Shipping carton (RSC)",
    unit: "cm",
    dims: { width: 40, height: 30, length: 30 },
    opening: "top_split_meet_center",
    hint: "Regular slotted carton; flaps meet at the center.",
  },
  {
    id: "tuck_end",
    label: "Tuck-end carton (tall)",
    unit: "cm",
    dims: { width: 7, height: 20, length: 4 },
    opening: "lid_from_back",
    hint: "Slim retail carton for cosmetics or pharma.",
  },
  {
    id: "rigid_gift",
    label: "Rigid gift box",
    unit: "cm",
    dims: { width: 22, height: 9, length: 22 },
    opening: "lid_from_back",
    hint: "Premium two-piece style with a lift-off lid.",
  },
  {
    id: "shoe_box",
    label: "Shoe box",
    unit: "cm",
    dims: { width: 33, height: 12, length: 20 },
    opening: "lid_from_back",
    hint: "Classic lidded shoe box proportions.",
  },
  {
    id: "wine_gift",
    label: "Wine / bottle box",
    unit: "cm",
    dims: { width: 10, height: 36, length: 10 },
    opening: "lid_from_front",
    hint: "Tall single-bottle presentation box.",
  },
  {
    id: "card_sleeve",
    label: "Slim card sleeve",
    unit: "cm",
    dims: { width: 14, height: 2, length: 10 },
    opening: "door_left",
    hint: "Thin sleeve; try a side-opening panel.",
  },
  {
    id: "display_pdq",
    label: "Display / PDQ",
    unit: "cm",
    dims: { width: 30, height: 20, length: 24 },
    opening: "double_doors",
    hint: "Retail display; both side panels swing open.",
  },
];

export function getBoxTemplate(id: string): BoxTemplate | null {
  return BOX_TEMPLATES.find((t) => t.id === id) ?? null;
}
