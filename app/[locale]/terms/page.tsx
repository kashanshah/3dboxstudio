import { createTermsMetadata } from "@/lib/seo/metadata";
import TermsPage from "@/views/TermsPage";

export const metadata = createTermsMetadata();

export default function TermsRoute() {
  return <TermsPage />;
}
