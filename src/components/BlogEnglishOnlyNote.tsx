"use client";

import { useLocale, useTranslations } from "next-intl";
import { hasBlogTranslation } from "@/content/blogLocales";
import type { Locale } from "@/i18n/config";

/** Shown on non-English locales when this article has no translation yet. */
export default function BlogEnglishOnlyNote({ slug }: { slug: string }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("blog");
  if (locale === "en" || hasBlogTranslation(locale, slug)) return null;
  return <p className="blog-locale-note">{t("englishOnlyNote")}</p>;
}
