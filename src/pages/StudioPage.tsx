import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";
import BoxDesigner from "../BoxDesigner";
import { BUYMEACOFFEE_URL, GITHUB_REPO_URL } from "../siteMeta";

const STUDIO_DESC =
  "3D Box Studio — open-source packaging simulator: dimensions, materials, openings, per-face artwork, lighting, PNG export, local save.";

export default function StudioPage() {
  useLayoutEffect(() => {
    document.title = "Studio — 3D Box Studio (open source)";
    const setMeta = (name: string, content: string) => {
      let el = document.querySelector(`meta[name="${name}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
      el.setAttribute("data-route-seo", "1");
    };
    setMeta("description", STUDIO_DESC);
    return () => {
      document.querySelectorAll("[data-route-seo]").forEach((n) => n.remove());
    };
  }, []);

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", minHeight: 480 }}>
      <header
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "8px 14px",
          borderBottom: "1px solid var(--panel-border)",
          background: "var(--panel)",
        }}
      >
        <Link to="/" style={{ color: "var(--muted)", textDecoration: "none", fontSize: "0.85rem", fontWeight: 500 }}>
          ← Home
        </Link>
        <span style={{ color: "var(--panel-border)", userSelect: "none" }} aria-hidden>
          |
        </span>
        <span style={{ fontWeight: 600, fontSize: "0.9rem", letterSpacing: "-0.02em" }}>3D Box Studio</span>
        <span style={{ flex: 1 }} />
        <a
          href={GITHUB_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--muted)", fontSize: "0.82rem", textDecoration: "none" }}
        >
          GitHub
        </a>
        <span style={{ color: "var(--panel-border)", userSelect: "none" }} aria-hidden>
          ·
        </span>
        <a
          href={BUYMEACOFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "var(--muted)", fontSize: "0.82rem", textDecoration: "none" }}
        >
          Buy me a coffee
        </a>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <BoxDesigner />
      </div>
    </div>
  );
}
