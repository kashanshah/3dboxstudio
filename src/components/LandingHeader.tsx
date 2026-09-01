"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import SiteNav, { type SiteNavActive } from "./SiteNav";

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

type LandingHeaderProps = {
  activeNav?: SiteNavActive;
};

export default function LandingHeader({ activeNav }: LandingHeaderProps) {
  const [navOpen, setNavOpen] = useState(false);
  const navPanelRef = useRef<HTMLElement | null>(null);

  const closeNav = () => setNavOpen(false);

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

  return (
    <header className={`landing-nav${navOpen ? " landing-nav--open" : ""}`}>
      <div className="landing-container landing-nav-inner">
        <Link className="landing-brand" href="/" onClick={closeNav}>
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
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) closeNav();
          }}
        >
          <SiteNav activeNav={activeNav} />
        </nav>
      </div>
    </header>
  );
}
