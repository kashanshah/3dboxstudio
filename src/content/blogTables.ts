export type BlogTable = {
  id: string;
  title: string;
  intro?: string;
  ariaLabel: string;
  columns: string[];
  rows: string[][];
  afterHeading: string;
};

/**
 * Structured table content for articles. Keeping table data outside components means
 * BlogPostBody can render tables generically without slug-specific JSX branches.
 * `afterHeading` places a table in the article flow next to the relevant section.
 */
export const BLOG_TABLES_BY_SLUG: Record<string, BlogTable[]> = {
  "free-pacdora-alternative-3d-box-mockups": [
    {
      id: "pacdora-comparison",
      title: "3D Box Studio vs. Pacdora: which one fits your job?",
      intro:
        "The useful question is not which tool is universally better. It is whether you need a fast, free 3D packaging mockup for visual review or a broader packaging platform with structural and template workflows.",
      ariaLabel: "3D Box Studio and Pacdora feature comparison",
      columns: ["Capability", "3D Box Studio", "Pacdora"],
      rows: [
        ["Best fit", "Fast visual box mockups and interactive reviews", "Broader packaging design and dieline workflows"],
        ["Browser based", "Yes", "Yes"],
        ["Custom box dimensions", "Yes", "Yes"],
        ["Per-face artwork", "Yes", "Yes"],
        ["Interactive 3D preview", "Yes — orbit, materials and supported openings", "Yes"],
        ["PNG / visual exports", "Yes", "Yes, with broader rendering options"],
        ["Cloud save and share", "Yes", "Yes"],
        ["Production dielines", "No — use your converter or packaging CAD", "Available for supported structures and workflows"],
        ["Template library", "Focused box workflow", "Large packaging template library"],
      ],
      afterHeading: "When to use Pacdora vs. a free 3D box mockup tool",
    },
  ],
};

export function getBlogTables(slug: string): BlogTable[] {
  return BLOG_TABLES_BY_SLUG[slug] ?? [];
}
