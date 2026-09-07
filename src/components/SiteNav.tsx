"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
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
  const t = useTranslations("nav");

  return (
    <>
      <Link href="/">{t("home")}</Link>
      <Link href={sectionHref(pathname, "#features")}>{t("features")}</Link>
      <Link href={sectionHref(pathname, "#gallery")}>{t("screenshots")}</Link>
      <Link href={sectionHref(pathname, "#showcase")}>{t("showcase")}</Link>
      <Link href="/faq" aria-current={activeNav === "faq" ? "page" : undefined}>
        {t("faq")}
      </Link>
      <Link href="/blog" aria-current={activeNav === "blog" ? "page" : undefined}>
        {t("blog")}
      </Link>
      <Link href="/contact" aria-current={activeNav === "contact" ? "page" : undefined}>
        {t("contact")}
      </Link>
      <StudioLink href="/studio" className="btn btn-primary landing-nav-cta" trackCta ctaLocation="header">
        {t("openStudio")}
        <IconArrowRight />
      </StudioLink>
    </>
  );
}
