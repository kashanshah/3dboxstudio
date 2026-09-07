"use client";

import { useTranslations } from "next-intl";
import type { TocItem } from "@/lib/toc";

type OnThisPageTocProps = {
  items: TocItem[];
  variant: "mobile" | "desktop";
  activeId?: string | null;
};

function TocList({ items, activeId }: { items: TocItem[]; activeId?: string | null }) {
  return (
    <ol className="on-this-page-list">
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <li key={item.id}>
            <a
              className={`on-this-page-link${isActive ? " is-active" : ""}`}
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

/** Sticky desktop / collapsible mobile “On this page” navigation. */
export default function OnThisPageToc({
  items,
  variant,
  activeId,
}: OnThisPageTocProps) {
  const t = useTranslations("blog");
  if (items.length === 0) return null;

  if (variant === "mobile") {
    return (
      <details className="on-this-page on-this-page--mobile">
        <summary className="on-this-page-summary">{t("onThisPage")}</summary>
        <TocList items={items} activeId={activeId} />
      </details>
    );
  }

  return (
    <nav className="on-this-page on-this-page--desktop" aria-label={t("onThisPage")}>
      <p className="on-this-page-heading">{t("onThisPage")}</p>
      <TocList items={items} activeId={activeId} />
    </nav>
  );
}
