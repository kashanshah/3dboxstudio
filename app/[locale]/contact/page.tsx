import { createContactMetadata } from "@/lib/seo/metadata";
import ContactPage from "@/views/ContactPage";

type PageProps = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

type MetadataProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: MetadataProps) {
  const { locale } = await params;
  return createContactMetadata(locale);
}

export default async function ContactRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialStatus =
    params.sent === "1" ? "success" : params.error === "1" ? "error" : "idle";

  return <ContactPage initialStatus={initialStatus} />;
}
