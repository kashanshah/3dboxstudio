import Link from "next/link";
import ContentPageShell from "@/components/ContentPageShell";
import NotFoundIllustration from "@/components/NotFoundIllustration";

export default function NotFoundPage() {
  return (
    <ContentPageShell>
      <section className="landing-section content-page-hero gradient-section not-found-page">
        <div className="landing-container not-found-inner">
          <figure className="not-found-visual" aria-hidden>
            <NotFoundIllustration />
          </figure>

          <div className="not-found-copy">
            <p className="landing-eyebrow landing-eyebrow--section">
              Page not found
            </p>
            <h1 className="landing-display content-page-title not-found-title">
              This page isn&apos;t in the box
            </h1>
            <p className="landing-section-intro content-page-intro not-found-intro">
              We couldn&apos;t find that URL—maybe the link moved, or the carton
              shifted. Jump back home or open the free 3D box designer to build
              folding cartons and mailer mockups in your browser.
            </p>

            <div className="not-found-actions">
              <Link
                href="/studio"
                className="btn btn-primary landing-btn-hero-primary"
              >
                <span>Launch 3D studio</span>
                <svg
                  className="landing-icon-arrow"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path
                    d="M5 12h14m-6-7l7 7-7 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.25"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
              <Link href="/" className="btn landing-btn-hero-secondary">
                Back to home
              </Link>
            </div>

            <p className="content-page-more not-found-links">
              <Link href="/blog">Packaging guides</Link>
              <span className="landing-footer-dot" aria-hidden>
                ·
              </span>
              <Link href="/faq">FAQ</Link>
            </p>
          </div>
        </div>
      </section>
    </ContentPageShell>
  );
}
