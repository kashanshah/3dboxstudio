"use client";

import { loadFancybox } from "../lib/loadFancybox";
import LandingHeroVideo from "../components/LandingHeroVideo";
import { useCallback, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import LandingHeader from "../components/LandingHeader";
import { Link } from "@/i18n/routing";
import StudioLink from "../components/StudioLink";
import LandingStudioCta from "../components/LandingStudioCta";
import ShowcaseSection from "../components/ShowcaseSection";
import FaqList from "../components/FaqList";
import SiteFooter from "../components/SiteFooter";
import { BLOG_POSTS, getBlogPostImageAlt, getBlogPostImagePath } from "../content/blogPosts";
import { getLocalizedBlogPost } from "../content/blogLocales";
import { FAQ_ITEMS, getLandingFaqItems } from "../content/faq";
import type { Locale } from "@/i18n/config";
import "../landing.css";

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

function IconPreviewLink() {
  return (
    <svg className="landing-card-svg" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7zm0 11.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z"
        opacity=".9"
      />
      <circle cx="12" cy="12" r="2.25" fill="currentColor" />
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

const LANDING_PRODUCT_GALLERY_BASE = [
  { src: "/images/screenshot-1.webp", width: 640, height: 400, altKey: "shot1Alt", captionKey: "shot1Caption" },
  { src: "/images/screenshot-2.webp", width: 640, height: 400, altKey: "shot2Alt", captionKey: "shot2Caption" },
  { src: "/images/screenshot-3.webp", width: 640, height: 400, altKey: "shot3Alt", captionKey: "shot3Caption" },
  { src: "/images/screenshot-4.webp", width: 640, height: 400, altKey: "shot4Alt", captionKey: "shot4Caption" },
] as const;

const HERO_PREVIEW = {
  src: "/images/hero-img.webp",
  video: "/showcase/videos/kazomo-spin-mop.mp4",
  width: 960,
  height: 540,
} as const;

const LANDING_FEATURED_POSTS = [...BLOG_POSTS]
  .sort((a, b) => b.published.localeCompare(a.published))
  .slice(0, 3);

/** Scroll past this many pixels before the main nav pins to the top of the viewport. */
export default function LandingPage() {
  const t = useTranslations("landing");
  const tHero = useTranslations("landing.hero");
  const tFeatures = useTranslations("landing.features");
  const tGallery = useTranslations("landing.gallery");
  const tSteps = useTranslations("landing.steps");
  const tGuides = useTranslations("landing.guides");
  const tFaq = useTranslations("landing.faq");
  const tCta = useTranslations("landing.ctaBand");
  const tFaqs = useTranslations("landing.faqs");
  const locale = useLocale() as Locale;

  const productGallery: LandingGalleryItem[] = useMemo(
    () =>
      LANDING_PRODUCT_GALLERY_BASE.map((shot) => ({
        src: shot.src,
        width: shot.width,
        height: shot.height,
        alt: tGallery(shot.altKey),
        caption: tGallery(shot.captionKey),
      })),
    [tGallery]
  );

  const landingFaqs = useMemo(
    () =>
      getLandingFaqItems().map((item) => ({
        ...item,
        question: tFaqs(`${item.id}.question`),
        answer: tFaqs(`${item.id}.answer`),
      })),
    [tFaqs]
  );

  const openProductTourGallery = useCallback(
    (startIndex: number) => {
      const slides = productGallery.map((shot) => ({
        src: shot.src,
        type: "image" as const,
        caption: shot.caption,
        alt: shot.alt,
      }));
      void loadFancybox().then((Fancybox) => {
        Fancybox.show(slides, {
          startIndex,
          closeExisting: true,
          theme: "auto",
          placeFocusBack: true,
        });
      });
    },
    [productGallery]
  );

  return (
    <div className="landing-root">
      <div className="landing-bg-grid" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--a" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--b" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--c" aria-hidden />
      <div className="landing-noise" aria-hidden />

      <LandingHeader />

      <main className="landing-main">
        <div className="landing-hero-wrap">
          <div className="landing-hero-shell">
            <div className="landing-hero-mesh" aria-hidden />
            <div className="landing-container">
              <section className="landing-hero" aria-labelledby="hero-heading">
                <div className="landing-hero-copy">
                  <p className="landing-eyebrow">{tHero("eyebrow")}</p>
                  <h1 id="hero-heading" className="landing-display">
                    <span className="landing-hero-title-line">{tHero("titleLine1")}</span>
                    <span className="landing-hero-title-accent">{tHero("titleLine2")}</span>
                    <span className="landing-hero-title-line landing-hero-title-sub">
                      {tHero("titleLine3")}
                    </span>
                  </h1>
                  <p className="landing-hero-lead">{tHero("lead")}</p>
                  <div className="landing-hero-ctas">
                    <StudioLink
                      href="/studio"
                      className="btn btn-primary landing-btn-hero-primary"
                      trackCta
                      ctaLocation="hero"
                      sourcePageType="homepage"
                    >
                      <span>{tHero("launchCta")}</span>
                      <IconArrowRight />
                    </StudioLink>
                    <a href="#features" className="btn landing-btn-hero-secondary">
                      {tHero("exploreCta")}
                    </a>
                  </div>
                  <ul className="landing-hero-meta" aria-label={tHero("highlightsAria")}>
                    <li>{tHero("meta1")}</li>
                    <li>{tHero("meta2")}</li>
                    <li>{tHero("meta3")}</li>
                    <li>{tHero("meta4")}</li>
                    <li>{tHero("meta5")}</li>
                    <li>{tHero("meta6")}</li>
                  </ul>
                </div>
                <figure className="landing-hero-visual">
                  <span className="landing-hero-badge">{tHero("badge")}</span>
                  <div className="landing-hero-visual-ring" aria-hidden />
                  <div className="landing-hero-visual-inner">
                    <LandingHeroVideo
                      src={HERO_PREVIEW.video}
                      poster={HERO_PREVIEW.src}
                      width={HERO_PREVIEW.width}
                      height={HERO_PREVIEW.height}
                      alt={tHero("previewAlt")}
                    />
                  </div>
                </figure>
              </section>

              <div className="landing-proof" aria-label={tHero("proofAria")}>
                <div className="landing-proof-item">
                  <strong>{tHero("proofPbrTitle")}</strong>
                  <span>{tHero("proofPbrBody")}</span>
                </div>
                <div className="landing-proof-divider" aria-hidden />
                <div className="landing-proof-item">
                  <strong>{tHero("proofHdriTitle")}</strong>
                  <span>{tHero("proofHdriBody")}</span>
                </div>
                <div className="landing-proof-divider" aria-hidden />
                <div className="landing-proof-item">
                  <strong>{tHero("proofOpenTitle")}</strong>
                  <span>{tHero("proofOpenBody")}</span>
                </div>
                <div className="landing-proof-divider" aria-hidden />
                <div className="landing-proof-item">
                  <strong>{tHero("proofShareTitle")}</strong>
                  <span>{tHero("proofShareBody")}</span>
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
                <p className="landing-eyebrow landing-eyebrow--section">{tFeatures("eyebrow")}</p>
                <h2 id="features-heading" className="landing-display">{tFeatures("title")}</h2>
              </div>
            </div>
            <p className="landing-section-intro">{tFeatures("intro")}</p>
            <div className="landing-features">
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconViewport />
                  </span>
                  <h3>{tFeatures("viewportTitle")}</h3>
                </div>
                <p>{tFeatures("viewportBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconRuler />
                  </span>
                  <h3>{tFeatures("dimensionsTitle")}</h3>
                </div>
                <p>{tFeatures("dimensionsBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconMaterial />
                  </span>
                  <h3>{tFeatures("materialsTitle")}</h3>
                </div>
                <p>{tFeatures("materialsBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconOpen />
                  </span>
                  <h3>{tFeatures("openingsTitle")}</h3>
                </div>
                <p>{tFeatures("openingsBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconImage />
                  </span>
                  <h3>{tFeatures("artworkTitle")}</h3>
                </div>
                <p>{tFeatures("artworkBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconEnvironmentPreset />
                  </span>
                  <h3>{tFeatures("envTitle")}</h3>
                </div>
                <p>{tFeatures("envBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconSave />
                  </span>
                  <h3>{tFeatures("cloudTitle")}</h3>
                </div>
                <p>{tFeatures("cloudBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconPreviewLink />
                  </span>
                  <h3>{tFeatures("previewTitle")}</h3>
                </div>
                <p>{tFeatures("previewBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconJson />
                  </span>
                  <h3>{tFeatures("jsonTitle")}</h3>
                </div>
                <p>{tFeatures("jsonBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconSave />
                  </span>
                  <h3>{tFeatures("pngTitle")}</h3>
                </div>
                <p>{tFeatures("pngBody")}</p>
              </article>
              <article className="landing-card">
                <div className="landing-card-top">
                  <span className="landing-card-icon" aria-hidden>
                    <IconRecord />
                  </span>
                  <h3>{tFeatures("recordTitle")}</h3>
                </div>
                <p>{tFeatures("recordBody")}</p>
              </article>
            </div>
            <LandingStudioCta />
          </div>
        </section>

        <aside className="landing-pullquote" aria-label={t("quote.aria")}>
          <div className="landing-container">
            <blockquote>
              <p>{t("quote.text")}</p>
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
                <p className="landing-eyebrow landing-eyebrow--section">{tGallery("eyebrow")}</p>
                <h2 id="gallery-heading" className="landing-display">{tGallery("title")}</h2>
              </div>
            </div>
            <p className="landing-section-intro">
              {tGallery("introBefore")}{" "}
              <StudioLink href="/studio">{tGallery("introLink")}</StudioLink>{" "}
              {tGallery("introAfter")}
            </p>
            <div className="landing-screens">
              {productGallery.map((shot, i) => (
                <figure key={shot.src} className="landing-shot">
                  <button
                    type="button"
                    className="landing-shot-expand"
                    onClick={() => openProductTourGallery(i)}
                    aria-haspopup="dialog"
                    aria-label={tGallery("openShot", { index: i + 1, caption: shot.caption })}
                  >
                    <BrowserShell>
                      <img
                        src={shot.src}
                        width={shot.width}
                        height={shot.height}
                        loading="lazy"
                        decoding="async"
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
          id="steps"
          aria-labelledby="steps-heading"
        >
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-section-index" aria-hidden>
                04
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">{tSteps("eyebrow")}</p>
                <h2 id="steps-heading" className="landing-display">{tSteps("title")}</h2>
              </div>
            </div>
            <p className="landing-section-intro">{tSteps("intro")}</p>
            <div className="landing-steps">
              <div className="landing-step">
                <h3>{tSteps("step1Title")}</h3>
                <p>{tSteps("step1Body")}</p>
              </div>
              <div className="landing-step">
                <h3>{tSteps("step2Title")}</h3>
                <p>{tSteps("step2Body")}</p>
              </div>
              <div className="landing-step">
                <h3>{tSteps("step3Title")}</h3>
                <p>{tSteps("step3Body")}</p>
              </div>
            </div>
            <LandingStudioCta />
          </div>
        </section>

        <section
          className="landing-section landing-section--blog gradient-section"
          id="guides"
          aria-labelledby="guides-heading"
        >
          <div className="landing-container">
            <div className="landing-section-head">
              <span className="landing-section-index" aria-hidden>
                05
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">{tGuides("eyebrow")}</p>
                <h2 id="guides-heading" className="landing-display">{tGuides("title")}</h2>
              </div>
            </div>
            <p className="landing-section-intro">
              {tGuides("intro", { count: BLOG_POSTS.length })}
            </p>
            <ul className="blog-index-list blog-index-list--landing">
              {LANDING_FEATURED_POSTS.map((post) => {
                const localized = getLocalizedBlogPost(post.slug, locale) ?? post;
                return (
                <li key={post.slug} className="blog-index-card">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="blog-index-thumb-link"
                  >
                    <img
                      className="blog-index-thumb"
                      src={getBlogPostImagePath(post.slug)}
                      alt={getBlogPostImageAlt(localized)}
                      width={1200}
                      height={800}
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                  <h3 className="blog-index-title">
                    <Link href={`/blog/${post.slug}`}>{localized.title}</Link>
                  </h3>
                  <p className="blog-index-desc">{localized.description}</p>
                  <Link href={`/blog/${post.slug}`} className="blog-index-link">
                    {tGuides("readGuide")}
                  </Link>
                </li>
                );
              })}
            </ul>
            <p className="content-page-more">
              <Link href="/blog">{tGuides("viewAll")}</Link>
            </p>
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
                06
              </span>
              <div className="landing-section-head-copy">
                <p className="landing-eyebrow landing-eyebrow--section">{tFaq("eyebrow")}</p>
                <h2 id="faq-heading" className="landing-display">{tFaq("title")}</h2>
              </div>
            </div>
            <p className="landing-section-intro">{tFaq("intro")}</p>
            <FaqList items={landingFaqs} openFirst />
            <p className="content-page-more landing-faq-more">
              <Link href="/faq">{tFaq("browseAll", { count: FAQ_ITEMS.length })}</Link>
            </p>
          </div>
        </section>

        <section className="landing-cta-band" aria-labelledby="cta-heading">
          <div className="landing-container">
            <div className="landing-cta-band-card">
              <div className="landing-cta-band-glow" aria-hidden />
              <div className="landing-cta-band-inner">
                <h2 id="cta-heading" className="landing-display">{tCta("title")}</h2>
                <p>{tCta("body")}</p>
                <StudioLink
                  href="/studio"
                  className="btn btn-primary landing-btn-hero-primary"
                  trackCta
                  ctaLocation="inline"
                  sourcePageType="homepage"
                >
                  <span>{tCta("button")}</span>
                  <IconArrowRight />
                </StudioLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter showTopicSection />
    </div>
  );
}
