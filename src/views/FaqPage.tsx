import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import FaqExplorer from "@/components/FaqExplorer";
import { FAQ_ITEMS } from "@/content/faq";
import LandingStudioCta from "@/components/LandingStudioCta";

export default function FaqPage() {
  return (
    <ContentPageShell activeNav="faq">
      <section className="landing-section content-page-hero gradient-section">
        <div className="landing-container">
          <p className="landing-eyebrow landing-eyebrow--section">Support</p>
          <h1 className="landing-display content-page-title">
            Frequently asked questions
          </h1>
          <p className="landing-section-intro content-page-intro">
            Browse {FAQ_ITEMS.length} answers about 3D Box Studio — search by
            keyword or filter by topic.
          </p>
        </div>
      </section>

      <section className="landing-section landing-section--faq">
        <div className="landing-container">
          <FaqExplorer />
          <p className="content-page-more">
            Still have questions? Read our{" "}
            <Link href="/blog">packaging guides</Link> or{" "}
            <a
              href="https://github.com/kashanshah/3dboxstudio/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              open a GitHub issue
            </a>
            .
          </p>
          <LandingStudioCta />
        </div>
      </section>
    </ContentPageShell>
  );
}
