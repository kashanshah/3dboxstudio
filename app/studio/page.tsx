import { createStudioMetadata } from "@/lib/seo/metadata";
import StudioClient from "@/components/StudioClient";

export const metadata = createStudioMetadata();

export default function StudioRoute() {
  return <StudioClient />;
}
