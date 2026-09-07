"use client";

import { useLocale, useTranslations } from "next-intl";

/** Blogs are English-only in v1; shown on non-English locales. */
export default function BlogEnglishOnlyNote() {
  const locale = useLocale();
  const t = useTranslations("blog");
  if (locale === "en") return null;
  return <p className="blog-locale-note">{t("englishOnlyNote")}</p>;
}
