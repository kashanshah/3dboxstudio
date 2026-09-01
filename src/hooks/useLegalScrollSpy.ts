"use client";

import { useEffect, useState } from "react";

const SCROLL_SPY_OFFSET = 96;

export function useLegalScrollSpy(sectionIds: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
  const idsKey = sectionIds.join("|");

  useEffect(() => {
    const ids = idsKey ? idsKey.split("|") : [];
    if (ids.length === 0) {
      setActiveId(null);
      return;
    }

    const resolveActive = () => {
      let current = ids[0] ?? null;

      for (const id of ids) {
        const element = document.getElementById(id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= SCROLL_SPY_OFFSET) {
          current = id;
        } else {
          break;
        }
      }

      setActiveId(current);
    };

    resolveActive();
    window.addEventListener("scroll", resolveActive, { passive: true });
    window.addEventListener("resize", resolveActive);

    return () => {
      window.removeEventListener("scroll", resolveActive);
      window.removeEventListener("resize", resolveActive);
    };
  }, [idsKey]);

  return activeId;
}
