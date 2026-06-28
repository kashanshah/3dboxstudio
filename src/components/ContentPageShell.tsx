import type { ReactNode } from "react";
import Link from "next/link";
import { BUYMEACOFFEE_URL, GITHUB_REPO_URL, SITE_DOMAIN } from "../siteMeta";
import "../landing.css";

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

type ContentPageShellProps = {
  children: ReactNode;
  activeNav?: "blog" | "faq";
};

export default function ContentPageShell({
  children,
  activeNav,
}: ContentPageShellProps) {
  return (
    <div className="landing-root">
      <div className="landing-bg-grid" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--a" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--b" aria-hidden />
      <div className="landing-noise" aria-hidden />

      <header className="landing-nav landing-nav--affixed">
        <div className="landing-container landing-nav-inner">
          <Link className="landing-brand" href="/">
            <LogoMark />
            <span className="landing-brand-text">3D Box Studio</span>
          </Link>
          <nav className="landing-nav-links" aria-label="Primary">
            <Link href="/">Home</Link>
            <Link
              href="/blog"
              aria-current={activeNav === "blog" ? "page" : undefined}
            >
              Blog
            </Link>
            <Link
              href="/faq"
              aria-current={activeNav === "faq" ? "page" : undefined}
            >
              FAQ
            </Link>
            <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <Link href="/studio" className="btn btn-primary landing-nav-cta">
              Open studio
            </Link>
          </nav>
        </div>
      </header>

      {/* <div className="landing-nav-spacer" style={{ height: 72 }} aria-hidden /> */}

      <main className="landing-main">{children}</main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <LogoMark />
              <span>3D Box Studio</span>
            </div>
            <p className="landing-footer-links">
              <Link href="/">Home</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <Link href="/studio">Studio</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <Link href="/blog">Blog</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <Link href="/faq">FAQ</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a href={BUYMEACOFFEE_URL} target="_blank" rel="noopener noreferrer">
                Buy me a coffee
              </a>
            </p>
            <p className="landing-footer-tag">
              Free 3D box designer & maker · {SITE_DOMAIN} · open source (MIT).
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
