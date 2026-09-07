import { createFaqMetadata, FaqJsonLd } from "@/lib/seo/metadata";
import FaqPage from "@/views/FaqPage";

export const metadata = createFaqMetadata();

export default function FaqRoute() {
  return (
    <>
      <FaqJsonLd />
      <FaqPage />
    </>
  );
}
