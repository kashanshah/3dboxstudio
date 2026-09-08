import { createStudioMetadata, StudioJsonLd } from "@/lib/seo/metadata";
import StudioClient from "@/components/StudioClient";
import { getStudioPageMeta } from "@/seo/localePageMeta";
import { parseLocale } from "@/i18n/seoPolicy";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createStudioMetadata(locale);
}

export default async function StudioRoute({ params }: PageProps) {
  const { locale: localeParam } = await params;
  const locale = parseLocale(localeParam);
  const meta = getStudioPageMeta(locale);
  return (
    <>
      <StudioJsonLd locale={locale} />
      <div className="visually-hidden">
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </div>
      <StudioClient />
    </>
  );
}
