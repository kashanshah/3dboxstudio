import { createPrivacyMetadata } from "@/lib/seo/metadata";
import PrivacyPage from "@/views/PrivacyPage";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  return createPrivacyMetadata(locale);
}

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
