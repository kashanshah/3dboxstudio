import type { ReactNode } from "react";
import LandingHeader from "./LandingHeader";
import SiteFooter from "./SiteFooter";
import "../landing.css";

type ContentPageShellProps = {
  children: ReactNode;
  activeNav?: "blog" | "faq" | "contact";
};

export default function ContentPageShell({
  children,
  activeNav,
}: ContentPageShellProps) {
  return (
    <div className="landing-root">
      <div className="landing-bg-grid" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--a" aria-hidden />
      <div className="landing-bg-orb landing-bg-orb--b" aria-hidden />
      <div className="landing-noise" aria-hidden />

      <LandingHeader activeNav={activeNav} />

      <main className="landing-main">{children}</main>

      <SiteFooter />
    </div>
  );
}
