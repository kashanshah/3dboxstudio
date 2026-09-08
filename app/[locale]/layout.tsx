import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import AnalyticsPageView from "@/components/AnalyticsPageView";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import VercelAnalytics from "@/components/VercelAnalytics";
import BuyMeACoffeeWidget from "@/components/BuyMeACoffeeWidget";
import AttributionCapture from "@/components/AttributionCapture";
import { routing } from "@/i18n/routing";
import { parseLocale } from "@/i18n/seoPolicy";
import { getIndexableAlternateLocales, buildLanguageAlternates } from "@/i18n/seoPolicy";
import { getLandingPageMeta } from "@/seo/localePageMeta";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = parseLocale(localeParam);
  const meta = getLandingPageMeta(locale);
  return {
    title: {
      default: meta.title,
      template: "%s | 3D Box Studio",
    },
    description: meta.description,
    keywords: meta.keywords.split(", ").map((k) => k.trim()).filter(Boolean),
    alternates: {
      languages: buildLanguageAlternates("/", getIndexableAlternateLocales("/")),
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <GoogleAnalytics />
      <Suspense fallback={null}>
        <AttributionCapture />
        <AnalyticsPageView />
      </Suspense>
      <VercelAnalytics />
      <BuyMeACoffeeWidget />
    </NextIntlClientProvider>
  );
}
