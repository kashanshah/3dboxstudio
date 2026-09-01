"use client";

import type { LegalTocItem } from "@/lib/legalDocument";

type LegalTableOfContentsProps = {
  items: LegalTocItem[];
  variant: "mobile" | "desktop";
  activeId?: string | null;
};

function TocList({ items, activeId }: { items: LegalTocItem[]; activeId?: string | null }) {
  return (
    <ol className="legal-toc-list">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              className={`legal-toc-link${isActive ? " is-active" : ""}`}
              href={`#${item.id}`}
              aria-current={isActive ? "location" : undefined}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ol>
  );
}

export default function LegalTableOfContents({
  items,
  variant,
  activeId,
}: LegalTableOfContentsProps) {
  if (items.length === 0) return null;

  if (variant === "mobile") {
    return (
      <details className="legal-toc legal-toc--mobile">
        <summary className="legal-toc-summary">On this page</summary>
        <TocList items={items} activeId={activeId} />
      </details>
    );
  }

  return (
    <nav className="legal-toc legal-toc--desktop" aria-label="On this page">
      <p className="legal-toc-heading">On this page</p>
      <TocList items={items} activeId={activeId} />
    </nav>
  );
}
