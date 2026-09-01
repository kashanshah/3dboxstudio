export type LegalSection =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type LegalTocItem = {
  id: string;
  label: string;
};

export function slugifyLegalHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getLegalTocItems(sections: LegalSection[]): LegalTocItem[] {
  const used = new Set<string>();

  return sections
    .filter((section): section is Extract<LegalSection, { type: "h2" }> => section.type === "h2")
    .map((section) => {
      let id = slugifyLegalHeading(section.text);
      if (!id) id = "section";

      if (used.has(id)) {
        let suffix = 2;
        while (used.has(`${id}-${suffix}`)) suffix += 1;
        id = `${id}-${suffix}`;
      }

      used.add(id);
      return { id, label: section.text };
    });
}
