import Link from "next/link";
import LegalPageView from "@/components/legal/LegalPageView";
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_PAGE_DESCRIPTION,
  PRIVACY_SECTIONS,
} from "@/content/privacy";

export default function PrivacyPage() {
  return (
    <LegalPageView
      title="Privacy Policy"
      effectiveDate={PRIVACY_EFFECTIVE_DATE}
      description={PRIVACY_PAGE_DESCRIPTION}
      sections={PRIVACY_SECTIONS}
      footer={
        <>
          See also our <Link href="/terms">Terms of Service</Link>. Questions?{" "}
          <Link href="/contact">Contact us</Link> or read the <Link href="/faq">FAQ</Link> for
          quick answers about data and storage.
        </>
      }
    />
  );
}
