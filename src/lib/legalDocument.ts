import { allocateTocId, slugifyHeading, type TocItem } from "@/lib/toc";

export type LegalSection =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalTocItem = TocItem;

export const slugifyLegalHeading = slugifyHeading;

export function getLegalTocItems(sections: LegalSection[]): LegalTocItem[] {
  const used = new Set<string>();

  return sections
    .filter((section): section is Extract<LegalSection, { type: "h2" }> => section.type === "h2")
    .map((section) => {
      const id = allocateTocId(section.text, used);
      return { id, label: section.text };
    });
}
