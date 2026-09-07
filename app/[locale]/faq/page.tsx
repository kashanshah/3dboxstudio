import { createFaqMetadata, FaqJsonLd } from "@/lib/seo/metadata";
import FaqPage from "@/views/FaqPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createFaqMetadata(locale);
}

export default async function FaqRoute({ params }: PageProps) {
  const { locale } = await params;
  return (
    <>
      <FaqJsonLd locale={locale} />
      <FaqPage />
    </>
  );
}
