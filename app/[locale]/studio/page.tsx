import Link from "next/link";
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
        {locale === "en" ? (
          <section aria-label="About the 3D box maker">
            <h2>Online 3D box maker and packaging simulator</h2>
            <p>
              Use 3D Box Studio to create interactive folding-carton and mailer-box
              mockups in your browser. Enter custom dimensions, choose packaging
              materials, upload artwork to individual faces, rotate the box and
              simulate lid or flap openings before exporting a PNG mockup or sharing
              the design for review.
            </p>
            <p>
              The Studio is built for visual packaging previews rather than production
              dielines or structural CAD. For workflow guidance, see the{" "}
              <Link href="/blog/what-is-a-3d-box-designer">3D box designer guide</Link>,{" "}
              <Link href="/blog/3d-box-simulation-for-packaging-teams">3D box simulation guide</Link>,
              and our <Link href="/faq">3D Box Studio FAQ</Link>.
            </p>
          </section>
        ) : null}
      </div>
      <StudioClient />
    </>
  );
}
