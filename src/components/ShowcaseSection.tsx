import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";

export type ShowcaseFilter = "all" | "image" | "video";

export type ShowcaseItem = {
  src: string;
  type: "image" | "video";
  alt?: string;
  caption?: string;
};

const FALLBACK_ITEMS: ShowcaseItem[] = [
  {
    src: "/showcase/videos/kazomo-spin-mop.mp4",
    type: "video",
    alt: "Product packaging-style rotation video",
  },
];

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
    });
  }
  return out.length > 0 ? out : FALLBACK_ITEMS;
}

export default function ShowcaseSection() {
  const [allItems, setAllItems] = useState<ShowcaseItem[]>(FALLBACK_ITEMS);
  const [filter, setFilter] = useState<ShowcaseFilter>("all");
  const [index, setIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

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

  const filtered = useMemo(() => {
    if (filter === "all") return allItems;
    return allItems.filter((x) => x.type === filter);
  }, [allItems, filter]);

  useEffect(() => {
    setIndex((i) => {
      if (filtered.length === 0) return 0;
      return Math.min(i, filtered.length - 1);
    });
  }, [filtered.length, filter, allItems.length]);

  const current = filtered[index] ?? null;

  useEffect(() => {
    if (!autoPlay || filtered.length <= 1) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) return;
    const id = window.setInterval(() => {
      setIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    }, 7000);
    return () => window.clearInterval(id);
  }, [autoPlay, filtered.length, filter]);

  const goPrev = useCallback(() => {
    if (filtered.length === 0) return;
    setIndex((i) => (i - 1 + filtered.length) % filtered.length);
  }, [filtered.length]);

  const goNext = useCallback(() => {
    if (filtered.length === 0) return;
    setIndex((i) => (i + 1) % filtered.length);
  }, [filtered.length]);

  const onStageKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    },
    [goPrev, goNext]
  );

  const counts = useMemo(
    () => ({
      all: allItems.length,
      image: allItems.filter((x) => x.type === "image").length,
      video: allItems.filter((x) => x.type === "video").length,
    }),
    [allItems]
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
            <p className="landing-eyebrow landing-eyebrow--section">Showcase</p>
            <h2 id="showcase-heading" className="landing-display">
              Packaging visuals &amp; motion
            </h2>
          </div>
        </div>
        <p className="landing-section-intro">
          A rotating reel of images and short clips from <code>public/showcase/</code>. Edit{" "}
          <code>public/showcase/manifest.json</code> whenever you add files under <code>images/</code> or{" "}
          <code>videos/</code>.
        </p>

        <div className="landing-showcase-toolbar" role="group" aria-label="Showcase filters and playback">
          <div className="landing-showcase-filters">
            <span className="landing-showcase-filters-label" id="showcase-filter-label">
              Show
            </span>
            <div className="landing-showcase-filter-buttons" aria-labelledby="showcase-filter-label">
              {(
                [
                  { id: "all" as const, label: "All", count: counts.all },
                  { id: "image" as const, label: "Photos", count: counts.image },
                  { id: "video" as const, label: "Videos", count: counts.video },
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
          <label className="landing-showcase-autoplay">
            <input type="checkbox" checked={autoPlay} onChange={(e) => setAutoPlay(e.target.checked)} />
            Auto-advance (7s)
          </label>
        </div>

        {filtered.length === 0 ? (
          <p className="landing-showcase-empty" role="status">
            No items match this filter. Add photos or videos to the manifest, or switch to <strong>All</strong>.
          </p>
        ) : (
          <>
            <div
              className="landing-showcase-stage-wrap"
              tabIndex={0}
              onKeyDown={onStageKeyDown}
              role="region"
              aria-roledescription="carousel"
              aria-label="Showcase media"
            >
              <button type="button" className="landing-showcase-arrow landing-showcase-arrow--prev" onClick={goPrev} aria-label="Previous item">
                ‹
              </button>
              <div className="landing-showcase-stage" aria-live="polite" aria-atomic="true">
                {current?.type === "video" ? (
                  <video
                    key={current.src}
                    className="landing-showcase-media"
                    src={current.src}
                    controls
                    playsInline
                    loop
                    preload="metadata"
                    aria-label={current.alt ?? "Showcase video"}
                  />
                ) : (
                  <img
                    key={current?.src}
                    className="landing-showcase-media"
                    src={current?.src}
                    alt={current?.alt ?? "Showcase image"}
                    loading="lazy"
                  />
                )}
              </div>
              <button type="button" className="landing-showcase-arrow landing-showcase-arrow--next" onClick={goNext} aria-label="Next item">
                ›
              </button>
            </div>
            {current?.caption && <p className="landing-showcase-caption">{current.caption}</p>}
            <p className="landing-showcase-hint">
              Focus the gallery (Tab), then <span className="landing-showcase-hint-kbd">←</span> /{" "}
              <span className="landing-showcase-hint-kbd">→</span> · {index + 1} of {filtered.length}
            </p>

            <div className="landing-showcase-thumbs" role="tablist" aria-label="Showcase thumbnails">
              {filtered.map((item, i) => (
                <button
                  key={`${item.src}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={`landing-showcase-thumb${i === index ? " is-active" : ""}`}
                  onClick={() => setIndex(i)}
                  title={item.alt ?? (item.type === "video" ? "Video" : "Image")}
                >
                  {item.type === "video" ? (
                    <span className="landing-showcase-thumb-video" aria-hidden>
                      ▶
                    </span>
                  ) : (
                    <img src={item.src} alt="" loading="lazy" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
