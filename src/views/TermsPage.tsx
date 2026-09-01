import Link from "next/link";
import LegalPageView from "@/components/legal/LegalPageView";
import {
  TERMS_EFFECTIVE_DATE,
  TERMS_PAGE_DESCRIPTION,
  TERMS_SECTIONS,
} from "@/content/terms";

export default function TermsPage() {
  return (
    <LegalPageView
      title="Terms of Service"
      effectiveDate={TERMS_EFFECTIVE_DATE}
      description={TERMS_PAGE_DESCRIPTION}
      sections={TERMS_SECTIONS}
      footer={
        <>
          See also our <Link href="/privacy">Privacy Policy</Link>. Questions?{" "}
          <Link href="/contact">Contact us</Link>.
        </>
      }
    />
  );
}
