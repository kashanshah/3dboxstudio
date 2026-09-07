"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useEffect, type ReactNode } from "react";
import StudioLink from "./StudioLink";
import LanguageSwitcher from "./LanguageSwitcher";
import { BUYMEACOFFEE_URL, SITE_DOMAIN, SITE_ORIGIN_PUBLIC } from "../siteMeta";
import { FAQ_ITEMS } from "../content/faq";
import {
  FOOTER_FAQ_LINKS,
  FOOTER_GUIDE_LINKS,
  FOOTER_INDUSTRY_LINKS,
  FOOTER_TOPIC_LINKS,
} from "../content/footerLinks";

const FOOTER_ACCORDION_MQ = "(max-width: 980px)";

/** Closed <details> hide content in the UA stylesheet; CSS cannot force them open on desktop. */
function useFooterAccordionMode() {
  useEffect(() => {
    const mq = window.matchMedia(FOOTER_ACCORDION_MQ);
    const sync = () => {
      document
        .querySelectorAll<HTMLDetailsElement>(".site-footer-accordion, .site-footer-topics-accordion")
        .forEach((el) => {
          if (mq.matches) el.removeAttribute("open");
          else el.setAttribute("open", "");
        });
    };

    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
}

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

type FooterAccordionSectionProps = {
  title: string;
  ariaLabel: string;
  children: ReactNode;
};

function FooterAccordionSection({ title, ariaLabel, children }: FooterAccordionSectionProps) {
  return (
    <nav className="site-footer-col" aria-label={ariaLabel}>
      <details className="site-footer-accordion" open>
        <summary className="site-footer-accordion-summary">
          <span className="site-footer-col-title">{title}</span>
        </summary>
        <div className="site-footer-accordion-panel">{children}</div>
      </details>
    </nav>
  );
}

type SiteFooterProps = {
  /** Show the keyword/topic pill row (homepage). */
  showTopicSection?: boolean;
};

export default function SiteFooter({ showTopicSection = false }: SiteFooterProps) {
  const pathname = usePathname();
  const year = new Date().getFullYear();
  const t = useTranslations("footer");
  const tCommon = useTranslations("common");
  useFooterAccordionMode();

  return (
    <footer className="landing-footer site-footer">
      <div className="landing-container">
        <div className="site-footer-grid">
          <div className="site-footer-brand-col">
            <Link href="/" className="site-footer-brand">
              <LogoMark />
              <span>{tCommon("brand")}</span>
            </Link>
            <p className="site-footer-desc">{t("description")}</p>
            <StudioLink href="/studio" className="btn btn-primary site-footer-cta" trackCta ctaLocation="footer">
              {t("openStudio")}
            </StudioLink>
          </div>

          <FooterAccordionSection title={t("product")} ariaLabel={t("productAria")}>
            <ul className="site-footer-links">
              <li>
                <StudioLink href="/studio">{t("studio")}</StudioLink>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#features")}>{t("features")}</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#gallery")}>{t("screenshots")}</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#showcase")}>{t("showcase")}</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#steps")}>{t("howItWorks")}</Link>
              </li>
              <li>
                <Link href={sectionHref(pathname, "#guides")}>{t("packagingGuides")}</Link>
              </li>
            </ul>
          </FooterAccordionSection>

          <FooterAccordionSection title={t("guidesTools")} ariaLabel={t("guidesAria")}>
            <ul className="site-footer-links">
              <li>
                <Link href="/blog">{t("allArticles")}</Link>
              </li>
              {FOOTER_GUIDE_LINKS.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </FooterAccordionSection>

          <FooterAccordionSection title={t("helpSupport")} ariaLabel={t("helpAria")}>
            <ul className="site-footer-links">
              <li>
                <Link href="/faq">{t("faqCount", { count: FAQ_ITEMS.length })}</Link>
              </li>
              {FOOTER_FAQ_LINKS.map((item) => (
                <li key={item.id}>
                  <Link href={`/faq#${item.id}`}>{item.label}</Link>
                </li>
              ))}
              <li>
                <Link href="/contact">{t("contactSupport")}</Link>
              </li>
            </ul>
          </FooterAccordionSection>

          <FooterAccordionSection title={t("industryMockups")} ariaLabel={t("industryAria")}>
            <ul className="site-footer-links">
              {FOOTER_INDUSTRY_LINKS.map((item) => (
                <li key={item.slug}>
                  <Link href={`/blog/${item.slug}`}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </FooterAccordionSection>
        </div>

        {showTopicSection && (
          <details className="site-footer-topics site-footer-topics-accordion" open>
            <summary className="site-footer-topics-summary">
              <span className="site-footer-topics-title">{t("popularTopics")}</span>
            </summary>
            <div className="site-footer-topics-panel">
              <p className="site-footer-topics-lead">{t("topicsLead")}</p>
              <ul className="site-footer-topic-pills">
                {FOOTER_TOPIC_LINKS.map((topic) => (
                  <li key={topic.label}>
                    <Link href={topic.href} className="site-footer-topic-pill">
                      {topic.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        <div className="site-footer-bottom">
          <p className="site-footer-legal">
            {t("legalLine", { year, domain: SITE_DOMAIN })}
          </p>
          <p className="site-footer-bottom-links">
            <Link href="/privacy">{t("privacy")}</Link>
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <Link href="/terms">{t("terms")}</Link>
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <a href={BUYMEACOFFEE_URL} target="_blank" rel="noopener noreferrer">
              {t("buyMeACoffee")}
            </a>
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <LanguageSwitcher />
            <span className="site-footer-sep" aria-hidden>
              ·
            </span>
            <span className="site-footer-canonical">
              {t("canonical")} <span className="landing-mono">{SITE_ORIGIN_PUBLIC}</span>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
