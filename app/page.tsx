import { createLandingMetadata, LandingJsonLd } from "@/lib/seo/metadata";
import LandingPage from "@/views/LandingPage";

export const metadata = createLandingMetadata();

export default function HomePage() {
  return (
    <>
      <LandingJsonLd />
      <LandingPage />
    </>
  );
}
