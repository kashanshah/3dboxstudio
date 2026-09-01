import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import {
  PRIVACY_EFFECTIVE_DATE,
  PRIVACY_PAGE_DESCRIPTION,
  PRIVACY_SECTIONS,
  type PrivacySection,
} from "@/content/privacy";

function formatEffectiveDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function renderSection(section: PrivacySection, index: number) {
  switch (section.type) {
    case "h2":
      return (
        <h2 key={index} className="legal-page-h2">
          {section.text}
        </h2>
      );
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
}

export default function PrivacyPage() {
  return (
    <ContentPageShell>
      <article className="legal-page">
        <header className="landing-section content-page-hero gradient-section">
          <div className="landing-container legal-page-header">
            <p className="landing-eyebrow landing-eyebrow--section">Legal</p>
            <h1 className="landing-display content-page-title">Privacy Policy</h1>
            <p className="blog-post-meta">
              Last updated:{" "}
              <time dateTime={PRIVACY_EFFECTIVE_DATE}>
                {formatEffectiveDate(PRIVACY_EFFECTIVE_DATE)}
              </time>
            </p>
            <p className="landing-section-intro content-page-intro">{PRIVACY_PAGE_DESCRIPTION}</p>
          </div>
        </header>

        <section className="landing-section">
          <div className="landing-container legal-page-body">
            {PRIVACY_SECTIONS.map(renderSection)}

            <p className="content-page-more legal-page-contact">
              Questions? <Link href="/contact">Contact us</Link> or read the{" "}
              <Link href="/faq">FAQ</Link> for quick answers about data and storage.
            </p>
          </div>
        </section>
      </article>
    </ContentPageShell>
  );
}
