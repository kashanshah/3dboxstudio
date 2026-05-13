import { Link } from "react-router-dom";

/** Inline CTA used at the bottom of major landing sections. */
export default function LandingStudioCta() {
  return (
    <div className="landing-section-cta">
      <Link to="/studio" className="btn btn-primary landing-btn-hero-primary">
        <span>Launch 3D studio</span>
        <svg className="landing-icon-arrow" width="18" height="18" viewBox="0 0 24 24" aria-hidden>
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
    </div>
  );
}
