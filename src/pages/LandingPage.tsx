import { Fancybox } from "@fancyapps/ui";
import "@fancyapps/ui/dist/fancybox/fancybox.css";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link } from "react-router-dom";
import { getSiteOrigin } from "../seo/siteConfig";
import { applyLandingRouteSeo } from "../seo/landingHead";
import {
  BUYMEACOFFEE_URL,
  GITHUB_REPO_URL,
  SITE_DOMAIN,
  SITE_ORIGIN_PUBLIC,
} from "../siteMeta";
import LandingStudioCta from "../components/LandingStudioCta";
import ShowcaseSection from "../components/ShowcaseSection";
import "../landing.css";
import GithubLink from "../components/GithubLink";

function LogoMark() {
  return (
    <img
      className="landing-logo-mark"
      src="/logo-mark.svg"
      width={34}
      height={34}
      alt=""
      decoding="async"
    />
  );
}

function IconViewport() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
        fill="currentColor"
        opacity="0.2"
      />
      <path
        d="M7 15l3 2 5-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconRuler() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 8h16v8H4V8zm2 2v4h12v-4H6zm2 1h2v2H8v-2zm3 0h2v2h-2v-2zm3 0h2v2h-2v-2z"
        opacity=".9"
      />
    </svg>
  );
}

function IconMaterial() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <ellipse cx="12" cy="8" rx="8" ry="3" fill="currentColor" opacity=".25" />
      <path
        fill="currentColor"
        d="M4 8v5c0 1.7 3.6 3 8 3s8-1.3 8-3V8c0 1.7-3.6 3-8 3S4 9.7 4 8z"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M4 13v3c0 1.7 3.6 3 8 3s8-1.3 8-3v-3c0 1.7-3.6 3-8 3s-8-1.3-8-3z"
      />
    </svg>
  );
}

function IconOpen() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M4 10h16v10H4V10zm2 2v6h12v-6H6z"
        opacity=".35"
      />
      <path fill="currentColor" d="M12 4l8 5H4l8-5z" />
    </svg>
  );
}

function IconEnvironmentPreset() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="5.25" fill="currentColor" opacity="0.18" />
      <circle cx="12" cy="12" r="3.25" fill="currentColor" opacity="0.92" />
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        d="M12 2.75v2.25M12 19v2.25M4.34 4.34l1.59 1.59M18.07 18.07l1.59 1.59M2.75 12h2.25M19 12h2.25M4.34 19.66l1.59-1.59M18.07 5.93l1.59-1.59"
      />
    </svg>
  );
}

function IconImage() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <rect
        x="4"
        y="6"
        width="16"
        height="12"
        rx="2"
        fill="currentColor"
        opacity=".2"
      />
      <circle cx="9" cy="11" r="2" fill="currentColor" />
      <path
        fill="currentColor"
        d="M4 16l4-4 4 4 4-5 4 5v2H4v-2z"
        opacity=".55"
      />
    </svg>
  );
}

function IconSave() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M6 4h9l3 3v13H6V4zm2 2v4h8V6H8zm0 6v8h8v-8H8zm4 1h2v5h-2v-5z"
        opacity=".85"
      />
    </svg>
  );
}

function IconJson() {
  return (
    <svg
      className="landing-card-svg"
      viewBox="0 0 24 24"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"
        opacity="0.35"
      />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}

function IconRecord() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="8" fill="currentColor" opacity="0.2" />
      <path
        d="M12 2v4M12 20v4M2 12h4M20 12h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrowRight() {
  return (
    <svg
      className="landing-icon-arrow"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        d="M5 12h14m-6-7l7 7-7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrowserShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="landing-browser">
      <div className="landing-browser-chrome" aria-hidden>
        <div className="landing-browser-traffic">
          <span className="landing-browser-dot landing-browser-dot--r" />
          <span className="landing-browser-dot landing-browser-dot--y" />
          <span className="landing-browser-dot landing-browser-dot--g" />
        </div>
        <div className="landing-browser-url">
          <svg
            className="landing-browser-lock-svg"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path
              fill="currentColor"
              d="M12 1a5 5 0 0 0-5 5v4H6v13h12V10h-1V6a5 5 0 0 0-5-5zm0 2a3 3 0 0 1 3 3v4H9V6a3 3 0 0 1 3-3z"
              opacity="0.55"
            />
          </svg>
          <span>3dboxstudio.com / studio</span>
        </div>
      </div>
      <div className="landing-browser-viewport">{children}</div>
    </div>
  );
}

type LandingGalleryItem = {
  src: string;
  width: number;
  height: number;
  alt: string;
  caption: string;
};

const LANDING_PRODUCT_GALLERY: LandingGalleryItem[] = [
  {
    src: "/images/screenshot-1.webp",
    width: 640,
    height: 400,
    alt: "3D Box Studio: control panel beside a live 3D viewport with a sample carton",
    caption:
      "Editor layout: parameters and live 3D packaging preview side by side.",
  },
  {
    src: "/images/screenshot-2.webp",
    width: 640,
    height: 400,
    alt: "Per-face artwork upload section in the 3D box packaging simulator",
    caption: "Per-face artwork uploads with quick rotate and clear actions.",
  },
  {
    src: "/images/screenshot-3.webp",
    width: 640,
    height: 400,
    alt: "Opening styles and material presets in the carton 3D simulator",
    caption:
      "Opening styles and board presets for realistic packaging visualization.",
  },
  {
    src: "/images/screenshot-4.webp",
    width: 640,
    height: 400,
    alt: "Recording feature in the 3D box packaging simulator",
    caption: "Recording feature in the 3D box packaging simulator.",
  },
];

const HERO_PREVIEW = {
  src: "/images/hero-img.webp",
  video: "/showcase/videos/kazomo-spin-mop.mp4",
  width: 960,
  height: 540,
  alt: "Stylized 3D packaging box with studio lighting—representative of the interactive simulator",
  caption:
    "Stylized 3D packaging preview—representative of the interactive simulator.",
} as const;

/** Scroll past this many pixels before the main nav pins to the top of the viewport. */
const LANDING_NAV_STICKY_AFTER_SCROLL_PX = 700;

export default function LandingPage() {
  const origin = useMemo(() => getSiteOrigin(), []);
  const [navOpen, setNavOpen] = useState(false);
  const [navAffixed, setNavAffixed] = useState(false);
  const [navBarHeight, setNavBarHeight] = useState(0);
  const navBarRef = useRef<HTMLElement | null>(null);
  const navPanelRef = useRef<HTMLElement | null>(null);

  const openProductTourGallery = useCallback((startIndex: number) => {
    const slides = LANDING_PRODUCT_GALLERY.map((shot) => ({
      src: shot.src,
      type: "image" as const,
      caption: shot.caption,
      alt: shot.alt,
    }));
    Fancybox.show(slides, {
      startIndex,
      closeExisting: true,
      theme: "auto",
      placeFocusBack: true,
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 880px)");
    const syncBodyScrollLock = () => {
      const lock = navOpen && mq.matches;
      document.body.style.overflow = lock ? "hidden" : "";
    };
    syncBodyScrollLock();
    mq.addEventListener("change", syncBodyScrollLock);
    return () => {
      mq.removeEventListener("change", syncBodyScrollLock);
      document.body.style.overflow = "";
    };
  }, [navOpen]);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 881px)");
    const onWiden = () => {
      if (mq.matches) setNavOpen(false);
    };
    mq.addEventListener("change", onWiden);
    return () => mq.removeEventListener("change", onWiden);
  }, []);

  useEffect(() => {
    if (!navOpen || !navPanelRef.current) return;
    const first =
      navPanelRef.current.querySelector<HTMLElement>("a[href], button");
    queueMicrotask(() => first?.focus());
  }, [navOpen]);

  useLayoutEffect(() => {
    const el = navBarRef.current;
    if (!el) return;
    const measure = () => setNavBarHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setNavAffixed(window.scrollY >= LANDING_NAV_STICKY_AFTER_SCROLL_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    return applyLandingRouteSeo(document, origin);
  }, [origin]);

  return (
    <div className="landing-root">
      <div className="landing-bg-grid" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--a" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--b" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--c" aria-hidden />
      <div className="landing-noise" aria-hidden />

      <GithubLink />

      {navAffixed && navBarHeight > 0 && (
        <div
          className="landing-nav-spacer"
          style={{ height: navBarHeight }}
          aria-hidden
        />
      )}
      <header
        ref={navBarRef}
        className={`landing-nav${navOpen ? " landing-nav--open" : ""}${navAffixed ? " landing-nav--affixed" : ""}`}
      >
        <div className="landing-container landing-nav-inner">
          <Link
            className="landing-brand"
            to="/"
            onClick={() => setNavOpen(false)}
          >
            <LogoMark />
            <span className="landing-brand-text">3D Box Studio</span>
          </Link>
          <button
            type="button"
            className={`landing-nav-toggle${navOpen ? " landing-nav-toggle--open" : ""}`}
            aria-expanded={navOpen}
            aria-controls="landing-primary-nav"
            id="landing-nav-toggle"
            onClick={() => setNavOpen((o) => !o)}
            aria-label={navOpen ? "Close menu" : "Open menu"}
          >
            <span className="landing-nav-toggle-bars" aria-hidden>
              <span />
              <span />
              <span />
            </span>
          </button>
          <nav
            ref={navPanelRef}
            id="landing-primary-nav"
            className={`landing-nav-links${navOpen ? " is-open" : ""}`}
            aria-label="Primary"
          >
            <a href="#features" onClick={() => setNavOpen(false)}>
              Features
            </a>
            <a href="#gallery" onClick={() => setNavOpen(false)}>
              Screenshots
            </a>
            <a href="#showcase" onClick={() => setNavOpen(false)}>
              Showcase
            </a>
            <a href="#faq" onClick={() => setNavOpen(false)}>
              FAQ
            </a>
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setNavOpen(false)}
            >
              GitHub
            </a>
            <Link
              to="/studio"
              className="btn btn-primary landing-nav-cta"
              onClick={() => setNavOpen(false)}
            >
              Open studio
              <IconArrowRight />
            </Link>
          </nav>
        </div>
      </header>

      <main className="landing-main">
        <div className="landing-hero-wrap">
          <div className="landing-hero-shell">
            <div className="landing-hero-mesh" aria-hidden />
            <div className="landing-container">
              <section className="landing-hero" aria-labelledby="hero-heading">
                <div className="landing-hero-copy">
                  <p className="landing-eyebrow">
                    Free forever · Browser · WebGL · No account
                  </p>
                  <h1 id="hero-heading" className="landing-display">
                    <span className="landing-hero-title-line">
                      Free packaging box designer
                    </span>
                    <span className="landing-hero-title-accent">
                      and 3D carton simulator
                    </span>
                    <span className="landing-hero-title-line landing-hero-title-sub">
                      3D Box Studio · in your browser
                    </span>
                  </h1>
                  <p className="landing-hero-lead">
                    Preview folding cartons and mailer-style boxes with
                    realistic materials, HDRI lighting, lid and flap motions,
                    and per-face artwork. Built for designers, brands, and
                    printers who need a fast 3D packaging preview—not a full CAD
                    die-line engine.
                  </p>
                  <div className="landing-hero-ctas">
                    <Link
                      to="/studio"
                      className="btn btn-primary landing-btn-hero-primary"
                    >
                      <span>Launch 3D studio</span>
                      <IconArrowRight />
                    </Link>
                    <a
                      href="#features"
                      className="btn landing-btn-hero-secondary"
                    >
                      Explore features
                    </a>
                  </div>
                  <ul className="landing-hero-meta" aria-label="Highlights">
                    <li>Free packaging designer</li>
                    <li>No signup</li>
                    <li>Runs locally</li>
                    <li>Save in-browser</li>
                    <li>Export PNG</li>
                    <li>JSON import/export</li>
                    <li>Open source (MIT)</li>
                  </ul>
                </div>
                <figure className="landing-hero-visual">
                  <span className="landing-hero-badge">WebGL live</span>
                  <div className="landing-hero-visual-ring" aria-hidden />
                  <div className="landing-hero-visual-inner">
                    <video
                      className="landing-hero-visual-video"
                      src={HERO_PREVIEW.video}
                      poster={HERO_PREVIEW.src}
                      width={HERO_PREVIEW.width}
                      height={HERO_PREVIEW.height}
                      muted
                      loop
                      autoPlay
                      playsInline
                      aria-label={HERO_PREVIEW.alt}
                      preload="metadata"
                    />
                  </div>
                </figure>
              </section>

              <div className="landing-proof" aria-label="Product highlights">
                <div className="landing-proof-item">
                  <strong>PBR materials</strong>
                  <span>Kraft, carton, foil &amp; more</span>
                </div>
                <div className="landing-proof-divider" aria-hidden />
                <div className="landing-proof-item">
                  <strong>HDRI lighting</strong>
                  <span>Studio-grade reflections</span>
                </div>
                <div className="landing-proof-divider" aria-hidden />
                <div className="landing-proof-item">
                  <strong>Openings</strong>
                  <span>Lid, split top, door</span>
                </div>
                <div className="landing-proof-divider" aria-hidden />
                <div className="landing-proof-item">
                  <strong>Portable JSON</strong>
                  <span>Download &amp; share full designs</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section
          className="landing-section landing-section--features gradient-section"
          id="features"
          aria-labelledby="features-heading"
        >
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-section-index" aria-hidden>
                01
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">
                  Capabilities
                </p>
                <h2 id="features-heading" className="landing-display">
                  Everything you need for a convincing 3D packaging preview
                </h2>
              </div>
            </div>
            <p className="landing-section-intro">
              Whether you call it a 3D box simulator, carton configurator, or
              structural packaging preview, these tools help you validate scale,
              readability, and shelf presence before you commit to plates or
              samples.
            </p>
            <div className="landing-features">
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconViewport />
                  </span>
                  <h3>Real-time 3D viewport</h3>
                </div>
                <p>
                  Orbit, zoom (scroll or slider), HDRI environments, shadows,
                  and optional grid—ideal for packaging reviews and client
                  sign-off.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconRuler />
                  </span>
                  <h3>Dimensions & units</h3>
                </div>
                <p>
                  Set width, height, and depth in millimeters, centimeters, or
                  inches. Scene units convert to centimeters for consistent 3D
                  scale.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconMaterial />
                  </span>
                  <h3>PBR material presets</h3>
                </div>
                <p>
                  Kraft, white carton, gloss or matte plastic, corrugated, and
                  metallic foil—roughness, clearcoat, and environment response
                  tuned for packaging looks.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconOpen />
                  </span>
                  <h3>Opening mechanisms</h3>
                </div>
                <p>
                  Closed view, lid from back, split top flaps (hinge on long or
                  short side), and a swinging door-style left panel—animated
                  open amount.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconImage />
                  </span>
                  <h3>Per-face artwork & rotation</h3>
                </div>
                <p>
                  Upload PNG or JPG per face, rotate in 90° steps, and apply one
                  image to all faces when you need a quick placeholder wrap.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconEnvironmentPreset />
                  </span>
                  <h3>Environment presets</h3>
                </div>
                <p>
                  Choose from studio, city, warehouse, sunset, and dawn environments. This is a great way to get feedback on your design.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconJson />
                  </span>
                  <h3>JSON import &amp; export</h3>
                </div>
                <p>
                  Download a single <strong>v1 JSON</strong> file with
                  dimensions, materials, openings, lighting, zoom, and per-face
                  images (base64)—ideal for backups, handoff to teammates, or
                  moving between machines. Import a file back into the studio to
                  restore the full scene.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconSave />
                  </span>
                  <h3>Local save &amp; PNG export</h3>
                </div>
                <p>
                  Auto-save to browser storage on a short debounce, with
                  explicit save/clear controls. Export a high-resolution{" "}
                  <strong>PNG</strong> snapshot of the live viewport for decks,
                  RFQs, and marketing.
                </p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconRecord />
                  </span>
                  <h3>Record presentation</h3>
                </div>
                <p>
                  Record a 15-second video of the viewport with audio, then
                  download the MP4 file. This is a great way to share your 3D
                  packaging simulator with your team or clients.
                </p>
              </article>
            </div>
            <LandingStudioCta />
          </div>
        </section>

        <aside className="landing-pullquote" aria-label="Product philosophy">
          <div className="landing-container">
            <blockquote>
              <p>
                The goal is not to replace die-line CAD—it is to give everyone
                in the room a shared, believable picture of the box before time
                and money disappear into the wrong structure.
              </p>
            </blockquote>
          </div>
        </aside>

        <section
          className="landing-section landing-section--gallery gradient-section"
          id="gallery"
          aria-labelledby="gallery-heading"
        >
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-section-index" aria-hidden>
                02
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">
                  Product tour
                </p>
                <h2 id="gallery-heading" className="landing-display">
                  Inside the 3D packaging studio
                </h2>
              </div>
            </div>
            <p className="landing-section-intro">
              Below are illustrative screenshots of the interface layout and key
              workflows. Click any shot to open a full-size lightbox (same
              viewer as the portfolio—arrow keys to browse, Escape to close).
              Replace images with real captures from{" "}
              <Link to="/studio">your live studio</Link> for even stronger
              social proof and SEO image search coverage.
            </p>
            <div className="landing-screens">
              {LANDING_PRODUCT_GALLERY.map((shot, i) => (
                <figure key={shot.src} className="landing-shot">
                  <button
                    type="button"
                    className="landing-shot-expand"
                    onClick={() => openProductTourGallery(i)}
                    aria-haspopup="dialog"
                    aria-label={`Open screenshot ${i + 1} in gallery: ${shot.caption}`}
                  >
                    <BrowserShell>
                      <img
                        src={shot.src}
                        width={shot.width}
                        height={shot.height}
                        loading="lazy"
                        alt={shot.alt}
                      />
                    </BrowserShell>
                  </button>
                  <figcaption>{shot.caption}</figcaption>
                </figure>
              ))}
            </div>
            <LandingStudioCta />
          </div>
        </section>

        <ShowcaseSection />

        <section
          className="landing-section landing-section--step gradient-section"
          aria-labelledby="steps-heading"
        >
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-section-index" aria-hidden>
                04
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">
                  Workflow
                </p>
                <h2 id="steps-heading" className="landing-display">
                  From flat idea to 3D packaging check in minutes
                </h2>
              </div>
            </div>
            <p className="landing-section-intro">
              A lightweight workflow for teams who need a believable 3D box
              mockup without installing heavy CAD packages.
            </p>
            <div className="landing-steps">
              <div className="landing-step">
                <h3>Set structure & board</h3>
                <p>
                  Choose outer dimensions, material preset, and how the top or
                  door should open for your 3D carton preview.
                </p>
              </div>
              <div className="landing-step">
                <h3>Drop in artwork</h3>
                <p>
                  Map prints to faces, rotate to match portrait or landscape
                  panels, and iterate until the 3D box mockup reads clearly on
                  screen.
                </p>
              </div>
              <div className="landing-step">
                <h3>Share & save</h3>
                <p>
                  Export a PNG for decks and RFQs, or rely on local persistence
                  so your 3D packaging simulator session survives refresh.
                </p>
              </div>
            </div>
            <LandingStudioCta />
          </div>
        </section>

        <section
          className="landing-section landing-section--faq gradient-section"
          id="faq"
          aria-labelledby="faq-heading"
        >
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-section-index" aria-hidden>
                05
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">
                  Support
                </p>
                <h2 id="faq-heading" className="landing-display">
                  Frequently asked questions
                </h2>
              </div>
            </div>
            <p className="landing-section-intro">
              Straight answers for teams evaluating a browser-based 3D box
              designer versus desktop packaging engineering software.
            </p>
            <div className="landing-faq">
              <details open>
                <summary>
                  What is a 3D box designer or packaging simulator?
                </summary>
                <p>
                  It is a tool that shows your box as a three-dimensional object
                  so you can judge proportions, graphics, and opening behavior.
                  This project focuses on fast visualization—not die-line CAD,
                  knife validation, or print trapping.
                </p>
              </details>
              <details>
                <summary>
                  Is this a substitute for Esko, ArtiosCAD, or dedicated
                  packaging CAD?
                </summary>
                <p>
                  No. Those platforms engineer production die-lines. Our 3D
                  packaging simulator helps you communicate look & feel, camera
                  angles, and rough scale early. Export is a viewport PNG, not a
                  print plate.
                </p>
              </details>
              <details>
                <summary>Does the 3D box simulator work on mobile?</summary>
                <p>
                  The studio is built for desktop browsers with WebGL. Phones
                  may run it, but the control density is optimized for keyboard
                  and mouse users.
                </p>
              </details>
              <details>
                <summary>Where is my data stored?</summary>
                <p>
                  By default, optional local browser storage keeps your fields
                  and encoded images on-device. There is no account-backed cloud
                  sync in this open tool.
                </p>
              </details>
              <details>
                <summary>Will on-screen colors match my print run?</summary>
                <p>
                  Screen previews are RGB and depend on your display
                  calibration. This 3D packaging simulator is for structural and
                  graphic composition—not ink drawdowns or press proofs. Always
                  validate color with your printer&apos;s proofing process.
                </p>
              </details>
              <details>
                <summary>Can I export or import my design as JSON?</summary>
                <p>
                  Yes. In the studio, use <strong>Export JSON</strong> to
                  download a portable file (version 1) with your full setup
                  including embedded images. Use <strong>Import JSON</strong> to
                  load that file and replace the current scene—handy for
                  backups, sharing with a colleague, or switching computers
                  without relying on browser sync.
                </p>
              </details>
              <details>
                <summary>How do I use my own marketing screenshots?</summary>
                <p>
                  Export PNGs from the studio, then replace the files in{" "}
                  <code>public/landing/</code> or update the image paths in{" "}
                  <code>src/pages/LandingPage.tsx</code> so search and social
                  previews show your real product shots.
                </p>
              </details>
            </div>
          </div>
        </section>

        <section className="landing-cta-band" aria-labelledby="cta-heading">
          <div className="landing-container">
            <div className="landing-cta-band-card">
              <div className="landing-cta-band-glow" aria-hidden />
              <div className="landing-cta-band-inner">
                <h2 id="cta-heading" className="landing-display">
                  Ready to spin up your carton in 3D?
                </h2>
                <p>
                  Open the studio and iterate on materials, openings, and
                  artwork until the packaging story clicks.
                </p>
                <Link
                  to="/studio"
                  className="btn btn-primary landing-btn-hero-primary"
                >
                  <span>Start the 3D packaging simulator</span>
                  <IconArrowRight />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <section
          className="landing-section landing-section--kw"
          aria-labelledby="kw-heading"
        >
          <div className="landing-container">
            <h2 id="kw-heading" className="visually-hidden">
              Related topics
            </h2>
            <p className="landing-kw">
              <strong>Popular searches:</strong> 3D box designer, 3D packaging
              simulator, carton 3D preview, folding box visualizer, mailer box
              mockup, structural packaging preview, online box configurator,
              dieline visualization (flat artwork to 3D preview), PBR packaging
              render, shipping box designer tool, product box 3D online,
              corrugated box simulator, retail carton preview, CPG packaging
              review, print-ready proof companion (preview only).
            </p>
          </div>
        </section>

        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <LogoMark />
              <span>3D Box Studio</span>
            </div>
            <p className="landing-footer-links">
              <Link to="/studio">Studio</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a href="#features">Features</a>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a href="#gallery">Screenshots</a>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a href="#showcase">Showcase</a>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a
                href={BUYMEACOFFEE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buy me a coffee
              </a>
            </p>
            <p className="landing-footer-tag">
              Free packaging box designer · {SITE_DOMAIN} · 3D preview in your
              browser · open source (MIT).
            </p>
            {origin ? (
              <p className="landing-footer-tip">
                Canonical: <span className="landing-mono">{origin}</span>
              </p>
            ) : (
              <p className="landing-footer-tip">
                Set <span className="landing-mono">VITE_SITE_ORIGIN</span> in{" "}
                <code>.env</code> (e.g.{" "}
                <span className="landing-mono">{SITE_ORIGIN_PUBLIC}</span>) for
                canonical + Open Graph.
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
