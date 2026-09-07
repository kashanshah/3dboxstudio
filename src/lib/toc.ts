export type TocItem = {
  id: string;
  label: string;
};

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function allocateTocId(label: string, used: Set<string>): string {
  let id = slugifyHeading(label) || "section";
  if (used.has(id)) {
    let suffix = 2;
    while (used.has(`${id}-${suffix}`)) suffix += 1;
    id = `${id}-${suffix}`;
  }
  used.add(id);
  return id;
}
