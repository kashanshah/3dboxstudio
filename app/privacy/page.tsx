import { createPrivacyMetadata } from "@/lib/seo/metadata";
import PrivacyPage from "@/views/PrivacyPage";

export const metadata = createPrivacyMetadata();

export default function PrivacyRoute() {
  return <PrivacyPage />;
}
