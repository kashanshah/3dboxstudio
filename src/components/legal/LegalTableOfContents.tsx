"use client";

import OnThisPageToc from "@/components/OnThisPageToc";
import type { LegalTocItem } from "@/lib/legalDocument";

type LegalTableOfContentsProps = {
  items: LegalTocItem[];
  variant: "mobile" | "desktop";
  activeId?: string | null;
};

/** @deprecated Prefer OnThisPageToc; kept for legal pages. */
export default function LegalTableOfContents(props: LegalTableOfContentsProps) {
  return <OnThisPageToc {...props} />;
}
