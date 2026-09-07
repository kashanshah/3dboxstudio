import { createFaqMetadata, FaqJsonLd } from "@/lib/seo/metadata";
import FaqPage from "@/views/FaqPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createFaqMetadata(locale);
}

export default function FaqRoute() {
  return (
    <>
      <FaqJsonLd />
      <FaqPage />
    </>
  );
}
