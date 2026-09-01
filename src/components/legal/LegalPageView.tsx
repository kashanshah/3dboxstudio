import type { ReactNode } from "react";
import ContentPageShell from "@/components/ContentPageShell";
import LegalDocumentBody from "@/components/legal/LegalDocumentBody";
import { getLegalTocItems, type LegalSection } from "@/lib/legalDocument";

function formatEffectiveDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

type LegalPageViewProps = {
  eyebrow?: string;
  title: string;
  effectiveDate: string;
  description: string;
  sections: LegalSection[];
  footer: ReactNode;
};

export default function LegalPageView({
  eyebrow = "Legal",
  title,
  effectiveDate,
  description,
  sections,
  footer,
}: LegalPageViewProps) {
  const tocItems = getLegalTocItems(sections);

  return (
    <ContentPageShell>
      <section className="landing-section content-page-hero gradient-section">
        <div className="landing-container">
          <p className="landing-eyebrow landing-eyebrow--section">{eyebrow}</p>
          <h1 className="landing-display content-page-title">{title}</h1>
          <p className="blog-post-meta">
            Last updated:{" "}
            <time dateTime={effectiveDate}>{formatEffectiveDate(effectiveDate)}</time>
          </p>
          <p className="landing-section-intro content-page-intro">{description}</p>
        </div>
      </section>

      <section className="landing-section landing-section--faq landing-section--legal">
        <div className="landing-container">
          <LegalDocumentBody sections={sections} tocItems={tocItems} footer={footer} />
        </div>
      </section>
    </ContentPageShell>
  );
}
