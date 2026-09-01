import type { ReactNode } from "react";
import Link from "next/link";
import { BUYMEACOFFEE_URL, SITE_DOMAIN } from "../siteMeta";
import LandingHeader from "./LandingHeader";
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
  activeNav?: "blog" | "faq" | "contact";
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

      <LandingHeader activeNav={activeNav} />

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
              <Link href="/contact">Contact</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <Link href="/privacy">Privacy</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <a href={BUYMEACOFFEE_URL} target="_blank" rel="noopener noreferrer">
                Buy me a coffee
              </a>
            </p>
            <p className="landing-footer-tag">
              Free 3D box designer & maker · {SITE_DOMAIN}.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
