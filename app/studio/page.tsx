import { createStudioMetadata, StudioJsonLd } from "@/lib/seo/metadata";
import StudioClient from "@/components/StudioClient";
import { STUDIO_DESCRIPTION, STUDIO_TITLE } from "@/seo/studioHead";

export const metadata = createStudioMetadata();

export default function StudioRoute() {
  return (
    <>
      <StudioJsonLd />
      <div className="visually-hidden">
        <h1>{STUDIO_TITLE}</h1>
        <p>{STUDIO_DESCRIPTION}</p>
      </div>
      <StudioClient />
    </>
  );
}
