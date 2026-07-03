"use client";

import { useCallback, useState, type ReactNode } from "react";
import StudioDialog from "./StudioDialog";
import { IconExternalLink } from "./StudioIcons";
import { BUYMEACOFFEE_URL, GITHUB_REPO_URL, SITE_ORIGIN_PUBLIC } from "@/siteMeta";

export type StudioHelpModal = "about" | "share-app" | null;

const APP_SHARE_URL = `${SITE_ORIGIN_PUBLIC}/studio`;
const APP_SHARE_TITLE = "3D Box Studio — Free 3D Box Designer";
const APP_SHARE_TEXT =
  "Design folding cartons and mailer-style boxes in your browser—materials, openings, per-face artwork, and cloud share links. Free, no signup.";

type ExternalLinkProps = {
  href: string;
  children: ReactNode;
};

function ExternalLink({ href, children }: ExternalLinkProps) {
  return (
    <a className="studio-about-link" href={href} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <IconExternalLink />
    </a>
  );
}

type StudioHelpModalsProps = {
  modal: StudioHelpModal;
  onClose: () => void;
  onStatus?: (message: string) => void;
};

export default function StudioHelpModals({ modal, onClose, onStatus }: StudioHelpModalsProps) {
  const [shareBusy, setShareBusy] = useState(false);

  const copyAppLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(APP_SHARE_URL);
      onStatus?.("Link copied to clipboard.");
    } catch {
      onStatus?.("Could not copy link.");
    }
  }, [onStatus]);

  const shareApp = useCallback(async () => {
    setShareBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: APP_SHARE_TITLE,
          text: APP_SHARE_TEXT,
          url: APP_SHARE_URL,
        });
        onClose();
        onStatus?.("Thanks for sharing 3D Box Studio!");
      } else {
        await copyAppLink();
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      onStatus?.("Could not open share dialog.");
    } finally {
      setShareBusy(false);
    }
  }, [copyAppLink, onClose, onStatus]);

  return (
    <>
      <StudioDialog
        title="About 3D Box Studio"
        open={modal === "about"}
        onClose={onClose}
        width={480}
        footer={
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        }
      >
        <p className="studio-dialog-lead">
          <strong>3D Box Studio</strong> is a free, open-source packaging box designer that runs in your browser. Preview
          folding cartons and mailer-style boxes with PBR materials, HDRI lighting, lid and flap openings, per-face artwork,
          cloud save &amp; share links, PNG export, and JSON import/export.
        </p>
        <p className="studio-dialog-hint">No signup required. Built for designers, brands, and printers who need a fast 3D packaging preview.</p>
        <nav className="studio-about-links" aria-label="3D Box Studio links">
          <ExternalLink href={SITE_ORIGIN_PUBLIC}>Website</ExternalLink>
          <ExternalLink href={`${SITE_ORIGIN_PUBLIC}/studio`}>Open studio</ExternalLink>
          <ExternalLink href={`${SITE_ORIGIN_PUBLIC}/faq`}>FAQ</ExternalLink>
          <ExternalLink href={`${SITE_ORIGIN_PUBLIC}/blog`}>Blog</ExternalLink>
          <ExternalLink href={GITHUB_REPO_URL}>GitHub repository</ExternalLink>
          <ExternalLink href={BUYMEACOFFEE_URL}>Buy me a coffee</ExternalLink>
        </nav>
      </StudioDialog>

      <StudioDialog
        title="Share 3D Box Studio"
        open={modal === "share-app"}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn" onClick={() => void copyAppLink()}>
              Copy link
            </button>
            <button type="button" className="btn btn-primary" disabled={shareBusy} onClick={() => void shareApp()}>
              {shareBusy ? "Sharing…" : "Share…"}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          Tell friends about the free 3D box designer. Share the studio link so they can launch the app and start designing
          cartons in minutes.
        </p>
        <label className="studio-dialog-label" htmlFor="studio-app-share-url">
          Studio link
        </label>
        <input
          id="studio-app-share-url"
          className="studio-dialog-input"
          type="text"
          readOnly
          value={APP_SHARE_URL}
          onFocus={(e) => e.target.select()}
        />
        <p className="studio-dialog-hint">
          {typeof navigator !== "undefined" && "share" in navigator
            ? "Share opens your device share sheet (email, messages, social, etc.)."
            : "Copy the link and paste it anywhere."}
        </p>
      </StudioDialog>
    </>
  );
}
