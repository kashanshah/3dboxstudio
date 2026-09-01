import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import ContactForm from "@/components/ContactForm";
import { CONTACT_PAGE_DESCRIPTION } from "@/content/contact";
import LandingStudioCta from "@/components/LandingStudioCta";

type ContactPageProps = {
  initialStatus?: "idle" | "success" | "error";
};

export default function ContactPage({ initialStatus = "idle" }: ContactPageProps) {
  return (
    <ContentPageShell activeNav="contact">
      <section className="landing-section content-page-hero gradient-section">
        <div className="landing-container">
          <p className="landing-eyebrow landing-eyebrow--section">Contact</p>
          <h1 className="landing-display content-page-title">Get in touch</h1>
          <p className="landing-section-intro content-page-intro">{CONTACT_PAGE_DESCRIPTION}</p>
        </div>
      </section>

      <section className="landing-section landing-section--contact">
        <div className="landing-container">
          <div className="contact-layout">
            <aside className="contact-aside">
              <div className="contact-info-card">
                <h2>We&apos;re here to help</h2>
                <p>
                  Questions about the studio, sharing, or commercial use? Send a message and
                  we&apos;ll follow up by email.
                </p>
              </div>

              <div className="contact-info-card">
                <h3>Before you write</h3>
                <ul className="contact-info-list">
                  <li>
                    <Link href="/faq">Browse the FAQ</Link> for setup, export, and privacy answers.
                  </li>
                  <li>
                    <Link href="/blog">Read packaging guides</Link> for workflow tips and
                    comparisons.
                  </li>
                  <li>
                    <Link href="/studio">Open the studio</Link> to try the designer in your
                    browser.
                  </li>
                </ul>
              </div>

              <div className="contact-info-card contact-info-card--muted">
                <h3>Response time</h3>
                <p>Most messages get a reply within 2–3 business days.</p>
              </div>
            </aside>

            <div className="contact-form-panel">
              <ContactForm initialStatus={initialStatus} />
            </div>
          </div>

          <LandingStudioCta />
        </div>
      </section>
    </ContentPageShell>
  );
}
