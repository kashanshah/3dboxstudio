"use client";

import { useEffect } from "react";

/** Keeps <html lang> in sync for locale routes without nesting html elements. */
export default function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
