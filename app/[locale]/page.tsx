import { createLandingMetadata, LandingJsonLd } from "@/lib/seo/metadata";
import LandingPage from "@/views/LandingPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createLandingMetadata(locale);
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;
  return (
    <>
      <LandingJsonLd locale={locale} />
      <LandingPage />
    </>
  );
}
