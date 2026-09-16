"use client";

import type { ComponentProps } from "react";
import NextLink from "next/link";
import { useLocale } from "next-intl";
import { Link } from "@/i18n/routing";
import { needsEnglishBlogFallback } from "@/i18n/blogRouting";

/** Link straight to English when an article has no translation in this locale. */
export default function ContentLink({ locale, ...props }: ComponentProps<typeof Link>) {
  const currentLocale = useLocale();
  if (typeof props.href === "string" && needsEnglishBlogFallback(props.href, locale ?? currentLocale)) {
    // Avoid next-intl's explicit locale="en" /en prefix and extra redirect.
    return <NextLink {...props} hrefLang="en" />;
  }
  return <Link {...props} locale={locale} />;
}
