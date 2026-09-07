"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";
import { locales, type Locale } from "@/i18n/config";

export default function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  return (
    <label className="language-switcher">
      <span className="visually-hidden">{t("label")}</span>
      <select
        aria-label={t("label")}
        value={locale}
        onChange={(e) => {
          const next = e.target.value as Locale;
          router.replace(pathname, { locale: next });
        }}
      >
        {locales.map((code) => (
          <option key={code} value={code}>
            {t(code)}
          </option>
        ))}
      </select>
    </label>
  );
}
