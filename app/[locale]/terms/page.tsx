import { createTermsMetadata } from "@/lib/seo/metadata";
import TermsPage from "@/views/TermsPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createTermsMetadata(locale);
}

export default function TermsRoute() {
  return <TermsPage />;
}
