"use client";

import { loadFancybox } from "../lib/loadFancybox";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import LazyShowcaseVideo from "./LazyShowcaseVideo";
import LandingStudioCta from "./LandingStudioCta";

export type ShowcaseFilter = "all" | "image" | "video";

export type ShowcaseLayout = "standard" | "tall" | "wide";

export type ShowcaseItem = {
  src: string;
  type: "image" | "video";
  alt?: string;
  caption?: string;
  layout?: ShowcaseLayout;
};

const FALLBACK_ITEMS: ShowcaseItem[] = [
  {
    src: "/showcase/videos/kazomo-spin-mop.mp4",
    type: "video",
    layout: "wide",
    alt: "Product packaging-style rotation video",
    caption: "Example turntable reel from the showcase folder.",
  },
];

function parseLayout(v: unknown): ShowcaseLayout {
  if (v === "tall" || v === "wide" || v === "standard") return v;
  return "standard";
}

function normalizeManifest(raw: unknown): ShowcaseItem[] {
  if (!raw || typeof raw !== "object" || !("items" in raw)) return FALLBACK_ITEMS;
  const items = (raw as { items: unknown }).items;
  if (!Array.isArray(items)) return FALLBACK_ITEMS;
  const out: ShowcaseItem[] = [];
  for (const x of items) {
    if (!x || typeof x !== "object") continue;
    const o = x as Record<string, unknown>;
    const src = typeof o.src === "string" ? o.src.trim() : "";
    const type = o.type === "video" || o.type === "image" ? o.type : null;
    if (!src || !type) continue;
    out.push({
      src,
      type,
      alt: typeof o.alt === "string" ? o.alt : undefined,
      caption: typeof o.caption === "string" ? o.caption : undefined,
      layout: parseLayout(o.layout),
    });
  }
  return out.length > 0 ? out : FALLBACK_ITEMS;
}

function layoutClass(layout: ShowcaseLayout | undefined): string {
  const l = layout ?? "standard";
  if (l === "tall") return "landing-showcase-tile--tall";
  if (l === "wide") return "landing-showcase-tile--wide";
  return "landing-showcase-tile--standard";
}

function ShowcaseEnlargeIcon() {
  return (
    <svg
      className="landing-showcase-tile-enlarge-svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
      />
    </svg>
  );
}

export default function ShowcaseSection() {
  const t = useTranslations("landing.showcase");
  const [allItems, setAllItems] = useState<ShowcaseItem[]>(FALLBACK_ITEMS);
  const [filter, setFilter] = useState<ShowcaseFilter>("all");

  useEffect(() => {
    const ac = new AbortController();
    void fetch("/showcase/manifest.json", { signal: ac.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setAllItems(normalizeManifest(data));
      })
      .catch(() => {
        /* keep fallback */
      });
    return () => ac.abort();
  }, []);

  useEffect(() => {
    return () => {
      void loadFancybox().then((Fancybox) => Fancybox.destroy());
    };
  }, []);

  const filtered = useMemo(() => {
    if (filter === "all") return allItems;
    return allItems.filter((x) => x.type === filter);
  }, [allItems, filter]);

  const counts = useMemo(
    () => ({
      all: allItems.length,
      image: allItems.filter((x) => x.type === "image").length,
      video: allItems.filter((x) => x.type === "video").length,
    }),
    [allItems]
  );

  const openShowcaseGallery = useCallback(
    (startIndex: number) => {
      const slides = filtered.map((it) => ({
        src: it.src,
        type: it.type === "video" ? ("video" as const) : ("image" as const),
        caption: it.caption ?? it.alt ?? "",
      }));
      if (slides.length === 0) return;
      void loadFancybox().then((Fancybox) => {
        Fancybox.show(slides, {
          startIndex,
          closeExisting: true,
          theme: "auto",
        });
      });
    },
    [filtered]
  );

  return (
    <section
      className="landing-section landing-section--showcase gradient-section"
      id="showcase"
      aria-labelledby="showcase-heading"
    >
      <div className="landing-container">
        <div className="landing-section-head">
          <span className="landing-section-index" aria-hidden>
            03
          </span>
          <div className="landing-section-head-copy">
            <p className="landing-eyebrow landing-eyebrow--section">{t("eyebrow")}</p>
            <h2 id="showcase-heading" className="landing-display">
              {t("title")}
            </h2>
          </div>
        </div>

        <p className="landing-section-intro">{t("intro")}</p>

        <div className="landing-showcase-toolbar" role="group" aria-label={t("filtersAria")}>
          <div className="landing-showcase-filters">
            <span className="landing-showcase-filters-label" id="showcase-filter-label">
              {t("showLabel")}
            </span>
            <div className="landing-showcase-filter-buttons" aria-labelledby="showcase-filter-label">
              {(
                [
                  { id: "all" as const, label: t("filterAll"), count: counts.all },
                  { id: "image" as const, label: t("filterPhotos"), count: counts.image },
                  { id: "video" as const, label: t("filterVideos"), count: counts.video },
                ] as const
              ).map(({ id, label, count }) => (
                <button
                  key={id}
                  type="button"
                  className={`landing-showcase-filter-btn${filter === id ? " is-active" : ""}`}
                  onClick={() => setFilter(id)}
                  aria-pressed={filter === id}
                >
                  {label}
                  <span className="landing-showcase-filter-count" aria-hidden>
                    {count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="landing-showcase-empty" role="status">
            {t("empty")}
          </p>
        ) : (
          <div className="landing-showcase-grid" role="list">
            {filtered.map((item, i) => (
              <figure
                key={`${item.src}-${i}`}
                className={`landing-showcase-tile ${layoutClass(item.layout)}`}
                role="listitem"
              >
                <div className="landing-showcase-tile-media-wrap">
                  {item.type === "video" ? (
                    <>
                      <LazyShowcaseVideo
                        src={item.src}
                        ariaLabel={item.alt ?? t("videoFallbackAlt")}
                      />
                      <button
                        type="button"
                        className="landing-showcase-tile-enlarge"
                        onClick={() => openShowcaseGallery(i)}
                        aria-label={
                          item.alt ? t("openGallery", { alt: item.alt }) : t("openVideo")
                        }
                      >
                        <ShowcaseEnlargeIcon />
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      className="landing-showcase-tile-zoom"
                      onClick={() => openShowcaseGallery(i)}
                      aria-label={
                        item.alt ? t("openGallery", { alt: item.alt }) : t("openImage")
                      }
                    >
                      <img
                        className="landing-showcase-tile-img"
                        src={item.src}
                        alt={item.alt ?? t("imageFallbackAlt")}
                        loading="lazy"
                        decoding="async"
                      />
                    </button>
                  )}
                </div>
                {item.caption && <figcaption className="landing-showcase-tile-caption">{item.caption}</figcaption>}
              </figure>
            ))}
          </div>
        )}

        <p className="landing-showcase-footnote">{t("footnote")}</p>
        <LandingStudioCta />
      </div>
    </section>
  );
}
