import { describe, expect, it } from "vitest";
import { mergeMessages } from "@/i18n/loadMessages";
import { stripLocalePrefix } from "@/i18n/pathname";

describe("mergeMessages", () => {
  it("lets manual overrides win over generated French", () => {
    const en = { nav: { openStudio: "Open studio", home: "Home" } };
    const generated = { nav: { openStudio: "Ouvrir le studio", home: "Accueil" } };
    const manual = { nav: { openStudio: "Lancer le studio" } };

    const merged = mergeMessages(en, generated, manual);
    expect(merged).toEqual({
      nav: {
        openStudio: "Lancer le studio",
        home: "Accueil",
      },
    });
  });
});

describe("stripLocalePrefix", () => {
  it("strips locale prefixes for analytics helpers", () => {
    expect(stripLocalePrefix("/fr")).toBe("/");
    expect(stripLocalePrefix("/fr/studio")).toBe("/studio");
    expect(stripLocalePrefix("/es/blog/foo")).toBe("/blog/foo");
    expect(stripLocalePrefix("/de")).toBe("/");
    expect(stripLocalePrefix("/studio")).toBe("/studio");
  });
});
