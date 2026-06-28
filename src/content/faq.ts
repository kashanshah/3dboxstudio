export type FaqCategoryId =
  | "overview"
  | "getting-started"
  | "comparison"
  | "export"
  | "privacy"
  | "technical";

export type FaqItem = {
  id: string;
  category: FaqCategoryId;
  question: string;
  answer: string;
};

export const FAQ_CATEGORIES: { id: FaqCategoryId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "getting-started", label: "Getting started" },
  { id: "comparison", label: "vs CAD tools" },
  { id: "export", label: "Export & files" },
  { id: "privacy", label: "Privacy & data" },
  { id: "technical", label: "Technical" },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "what-is-3d-box-designer",
    category: "overview",
    question: "What is a 3D box designer or packaging simulator?",
    answer:
      "A 3D box designer lets you preview how flat packaging artwork and structural choices look on a three-dimensional carton or mailer. A packaging simulator applies realistic lighting and materials so stakeholders can review proportions, openings, and branding before print.",
  },
  {
    id: "free-3d-box-maker",
    category: "getting-started",
    question: "Is 3D Box Studio a free 3D box maker?",
    answer:
      "Yes. 3D Box Studio is a free 3D box maker and design tool that runs entirely in your browser. There is no paywall for dimensions, materials, openings, per-face artwork, HDRI lighting, PNG export, or JSON import/export. Your work can be saved locally without creating an account.",
  },
  {
    id: "3d-box-simulation-use",
    category: "overview",
    question: "What is 3D box simulation used for?",
    answer:
      "3D box simulation helps packaging designers, brand teams, and printers validate scale, graphic placement, and opening behavior before committing to plates or physical samples. It is ideal for client presentations, e-commerce mockups, and internal design reviews—not for engineering production die-lines.",
  },
  {
    id: "vs-esko-artioscad",
    category: "comparison",
    question: "Is this a substitute for Esko, ArtiosCAD, or dedicated packaging CAD?",
    answer:
      "No. Those platforms engineer production die-lines. This 3D packaging simulator helps you communicate look and feel, camera angles, and rough scale early. Export is a viewport PNG, not a print plate.",
  },
  {
    id: "vs-mockup-templates",
    category: "comparison",
    question: "How is a 3D box design maker different from a mockup template site?",
    answer:
      "Template libraries give you fixed box shapes with uploaded artwork. A 3D box design maker like 3D Box Studio lets you adjust width, height, depth, materials, lid and flap openings, and per-face graphics in one interactive viewport—better for custom carton sizes and structural previews.",
  },
  {
    id: "mobile-support",
    category: "technical",
    question: "Does the 3D box simulator work on mobile?",
    answer:
      "The studio is built for desktop browsers with WebGL. Phones may run it, but the control density is optimized for keyboard and mouse users.",
  },
  {
    id: "data-storage",
    category: "privacy",
    question: "Where is my data stored?",
    answer:
      "Optional local browser storage keeps your fields and encoded images on-device. There is no account-backed cloud sync in this open tool.",
  },
  {
    id: "color-accuracy",
    category: "technical",
    question: "Will on-screen colors match my print run?",
    answer:
      "Screen previews are RGB and depend on your display calibration. This tool is for structural and graphic composition—not ink drawdowns or press proofs. Always validate color with your printer's proofing process.",
  },
  {
    id: "json-export-import",
    category: "export",
    question: "Can I export or import my 3D box design as JSON?",
    answer:
      "Yes. In the studio you can download a v1 JSON file that contains dimensions, materials, openings, viewport options, per-face rotations, and images as base64. Import that file on another machine or browser to restore the same preview. This is separate from automatic localStorage save.",
  },
  {
    id: "export-formats",
    category: "export",
    question: "What file formats can I export?",
    answer:
      "You can export a PNG snapshot of the 3D viewport for presentations and marketing, record a short MP4 video of the viewport, and save or share your full setup as a JSON file. There is no DXF, PDF die-line, or GLB export—the focus is fast visual preview.",
  },
  {
    id: "box-types",
    category: "overview",
    question: "What box types can I design?",
    answer:
      "3D Box Studio supports folding cartons and mailer-style boxes with configurable lid and flap openings. You can set custom dimensions in millimeters, centimeters, or inches and apply artwork to each face independently.",
  },
  {
    id: "who-is-it-for",
    category: "getting-started",
    question: "Who is 3D Box Studio for?",
    answer:
      "Graphic designers, packaging freelancers, brand managers, and print shops who need a quick 3D box preview without installing CAD software. It complements—not replaces—structural engineering tools when you need production-ready die-lines.",
  },
];

export function getCategoryLabel(id: FaqCategoryId): string {
  return FAQ_CATEGORIES.find((c) => c.id === id)?.label ?? id;
}

export const FAQ_PAGE_TITLE =
  "FAQ — 3D Box Designer, Maker & Simulator | 3D Box Studio";

export const FAQ_PAGE_DESCRIPTION =
  "Answers about 3D Box Studio: free 3D box designer, box maker, design tool, and packaging simulation. Compare with CAD, learn about export, mobile support, and data storage.";
