"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales, localeNames, type Locale } from "@/i18n/config";

const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  es: "🇪🇸",
  zh: "🇨🇳",
};

function IconChevronDown() {
  return (
    <svg className="language-switcher__chevron" width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path
        d="M6 9l6 6 6-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type LanguageSwitcherProps = {
  className?: string;
};

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const currentLabel = localeNames[locale] ?? t(locale);
  const currentFlag = localeFlags[locale];

  return (
    <div className={`language-switcher ${className}`.trim()} ref={rootRef}>
      <span className="visually-hidden">{t("label")}</span>
      <button
        type="button"
        className="language-switcher__trigger"
        aria-label={t("label")}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="language-switcher__flag" aria-hidden>
          {currentFlag}
        </span>
        <span className="language-switcher__label">{currentLabel}</span>
        <IconChevronDown />
      </button>
      {open && (
        <div className="language-switcher__menu" role="listbox" id={listboxId} aria-label={t("label")}>
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={locale === code}
              className={`language-switcher__option${locale === code ? " is-active" : ""}`}
              onClick={() => {
                setOpen(false);
                if (code === locale) return;
                const next = code as Locale;
                router.replace(pathname, { locale: next });
              }}
            >
              <span className="language-switcher__flag" aria-hidden>
                {localeFlags[code]}
              </span>
              <span className="language-switcher__option-text">{localeNames[code] ?? t(code)}</span>
            </button>
          ))}
        </div>
      )}
      <select
        className="language-switcher__native"
        aria-label={t("label")}
        value={locale}
        onChange={(e) => {
          const next = e.target.value as Locale;
          router.replace(pathname, { locale: next });
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {localeNames[code] ?? t(code)}
          </option>
        ))}
      </select>
    </div>
  );
}
