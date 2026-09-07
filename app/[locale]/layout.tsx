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
import { createLandingMetadata } from "@/lib/seo/metadata";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const languageAlternates = Object.fromEntries(
    routing.locales.map((item) => [item, item === "en" ? "/" : `/${item}`])
  );
  return {
    ...createLandingMetadata(locale),
    title: {
      default: "Free 3D Box Designer & Packaging Mockup Generator | 3D Box Studio",
      template: "%s | 3D Box Studio",
    },
    keywords: [
      "3d box designer",
      "3d box maker",
      "free 3d box maker",
      "online box designer",
      "packaging mockup generator",
      "free packaging mockup",
      "3d packaging simulator",
      "carton mockup",
      "mailer box mockup",
      "3d box studio",
    ],
    alternates: {
      languages: languageAlternates,
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
