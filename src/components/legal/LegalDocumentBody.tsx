"use client";

import type { ReactNode } from "react";
import LegalTableOfContents from "@/components/legal/LegalTableOfContents";
import { useLegalScrollSpy } from "@/hooks/useLegalScrollSpy";
import type { LegalSection, LegalTocItem } from "@/lib/legalDocument";

function renderSections(sections: LegalSection[], tocItems: { id: string }[]) {
  let headingIndex = 0;

  return sections.map((section, index) => {
    switch (section.type) {
      case "h2": {
        const id = tocItems[headingIndex]?.id;
        headingIndex += 1;
        return (
          <h2 key={index} id={id} className="legal-page-h2">
            {section.text}
          </h2>
        );
      }
      case "ul":
        return (
          <ul key={index} className="legal-page-ul">
            {section.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        );
      default:
        return (
          <p key={index} className="legal-page-p">
            {section.text}
          </p>
        );
    }
  });
}

type LegalDocumentBodyProps = {
  sections: LegalSection[];
  tocItems: LegalTocItem[];
  footer: ReactNode;
};

export default function LegalDocumentBody({
  sections,
  tocItems,
  footer,
}: LegalDocumentBodyProps) {
  const sectionIds = tocItems.map((item) => item.id);
  const activeId = useLegalScrollSpy(sectionIds);

  return (
    <>
      <LegalTableOfContents items={tocItems} variant="mobile" activeId={activeId} />

      <div className="legal-page-layout">
        <div className="legal-page-main">
          <div className="legal-page-panel">
            {renderSections(sections, tocItems)}
            <div className="content-page-more legal-page-contact">{footer}</div>
          </div>
        </div>

        <LegalTableOfContents items={tocItems} variant="desktop" activeId={activeId} />
      </div>
    </>
  );
}
