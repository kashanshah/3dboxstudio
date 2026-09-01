"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StudioLink from "./StudioLink";
import { BUYMEACOFFEE_URL, SITE_DOMAIN, SITE_ORIGIN_PUBLIC } from "../siteMeta";
import { FAQ_ITEMS } from "../content/faq";
import {
  FOOTER_FAQ_LINKS,
  FOOTER_GUIDE_LINKS,
  FOOTER_INDUSTRY_LINKS,
  FOOTER_TOPIC_LINKS,
} from "../content/footerLinks";

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

function sectionHref(pathname: string, hash: string): string {
  return pathname === "/" ? hash : `/${hash}`;
}

type SiteFooterProps = {
  /** Show the keyword/topic pill row (homepage). */
  showTopicSection?: boolean;
};

export default function SiteFooter({ showTopicSection = false }: SiteFooterProps) {
  const pathname = usePathname();
  const year = new Date().getFullYear();

  return (
    <footer className="landing-footer site-footer">
      <div className="landing-container">
        <div className="site-footer-grid">
          <div className="site-footer-brand-col">
            <Link href="/" className="site-footer-brand">
              <LogoMark />
              <span>3D Box Studio</span>
            </Link>
            <p className="site-footer-desc">
              Free browser-based 3D box designer and packaging simulator. Set custom dimensions,
              materials, openings, and per-face artwork—then export PNG mockups or share preview
              links with clients and teammates.
            </p>
            <StudioLink href="/studio" className="btn btn-primary site-footer-cta">
              Open free 3D studio
            </StudioLink>
          </div>

          <nav className="site-footer-col" aria-label="Product">
            <h2 className="site-footer-col-title">Product</h2>
            <ul className="site-footer-links">
              <li>
                <StudioLink href="/studio">3D box studio</StudioLink>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#features")}>Features</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#gallery")}>Screenshots</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#showcase")}>Showcase</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#steps")}>How it works</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#guides")}>Packaging guides</Link>
              </li>
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Packaging guides">
            <h2 className="site-footer-col-title">Guides &amp; tools</h2>
            <ul className="site-footer-links">
              <li>
                <Link href="/blog">All packaging articles</Link>
              </li>
              {FOOTER_GUIDE_LINKS.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer-col" aria-label="Help and industries">
            <h2 className="site-footer-col-title">Help &amp; industries</h2>
            <ul className="site-footer-links">
              <li>
                <Link href="/faq">FAQ ({FAQ_ITEMS.length} answers)</Link>
              </li>
              {FOOTER_FAQ_LINKS.map((item) => (
                <li key={item.id}>
                  <Link href={`/faq#${item.id}`}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/contact">Contact support</Link>
              </li>
            </ul>
            <h3 className="site-footer-subtitle">Industry mockups</h3>
            <ul className="site-footer-links">
              {FOOTER_INDUSTRY_LINKS.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {showTopicSection && (
          <section className="site-footer-topics" aria-labelledby="footer-topics-heading">
            <h2 id="footer-topics-heading" className="site-footer-topics-title">
              Popular packaging topics
            </h2>
            <p className="site-footer-topics-lead">
              Quick links for teams searching for a free 3D box design maker, carton simulator, or
              online packaging mockup generator.
            </p>
            <ul className="site-footer-topic-pills">
              {FOOTER_TOPIC_LINKS.map((topic) => (
                <li key={topic.label}>
                  <Link href={topic.href} className="site-footer-topic-pill">
                    {topic.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="site-footer-bottom">
          <p className="site-footer-legal">
            © {year} 3D Box Studio · {SITE_DOMAIN} · Free 3D box designer &amp; packaging simulator
            in your browser.
          </p>
          <p className="site-footer-bottom-links">
            <Link href="/privacy">Privacy</Link>
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <Link href="/terms">Terms</Link>
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <a href={BUYMEACOFFEE_URL} target="_blank" rel="noopener noreferrer">
              Buy me a coffee
            </a>
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <span className="site-footer-canonical">
              Canonical: <span className="landing-mono">{SITE_ORIGIN_PUBLIC}</span>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
