import { createContactMetadata } from "@/lib/seo/metadata";
import ContactPage from "@/views/ContactPage";

type PageProps = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export const metadata = createContactMetadata();

export default async function ContactRoute({ searchParams }: PageProps) {
  const params = await searchParams;
  const initialStatus =
    params.sent === "1" ? "success" : params.error === "1" ? "error" : "idle";

  return <ContactPage initialStatus={initialStatus} />;
}
