"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import StudioLink from "./StudioLink";

export type SiteNavActive = "blog" | "faq" | "contact";

type SiteNavProps = {
  activeNav?: SiteNavActive;
};

function sectionHref(pathname: string, hash: string): string {
  return pathname === "/" ? hash : `/${hash}`;
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

export default function SiteNav({ activeNav }: SiteNavProps) {
  const pathname = usePathname();

  return (
    <>
      <Link href="/">Home</Link>
      <Link href={sectionHref(pathname, "#features")}>Features</Link>
      <Link href={sectionHref(pathname, "#gallery")}>Screenshots</Link>
      <Link href={sectionHref(pathname, "#showcase")}>Showcase</Link>
      <Link href="/faq" aria-current={activeNav === "faq" ? "page" : undefined}>
        FAQ
      </Link>
      <Link href="/blog" aria-current={activeNav === "blog" ? "page" : undefined}>
        Blog
      </Link>
      <Link href="/contact" aria-current={activeNav === "contact" ? "page" : undefined}>
        Contact
      </Link>
      <StudioLink href="/studio" className="btn btn-primary landing-nav-cta" trackCta ctaLocation="header">
        Open studio
        <IconArrowRight />
      </StudioLink>
    </>
  );
}
