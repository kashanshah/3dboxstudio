"use client";

import { useCallback, useState, type ReactNode } from "react";
import StudioDialog from "./StudioDialog";
import { IconExternalLink } from "./StudioIcons";
import { BUYMEACOFFEE_URL, SITE_ORIGIN_PUBLIC } from "@/siteMeta";
import { useTranslations } from "next-intl";

export type StudioHelpModal = "about" | "share-app" | null;

const APP_SHARE_URL = `${SITE_ORIGIN_PUBLIC}/studio`;
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
  const t = useTranslations("studio.help");
  const [shareBusy, setShareBusy] = useState(false);

  const copyAppLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(APP_SHARE_URL);
      onStatus?.(t("linkCopied"));
    } catch {
      onStatus?.(t("copyFailed"));
    }
  }, [onStatus, t]);

  const shareApp = useCallback(async () => {
    setShareBusy(true);
    try {
      if (navigator.share) {
        await navigator.share({
          title: t("shareTitle"),
          text: t("shareText"),
          url: APP_SHARE_URL,
        });
        onClose();
        onStatus?.(t("thanks"));
      } else {
        await copyAppLink();
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      onStatus?.(t("shareFailed"));
    } finally {
      setShareBusy(false);
    }
  }, [copyAppLink, onClose, onStatus, t]);

  return (
    <>
      <StudioDialog
        title={t("aboutTitle")}
        open={modal === "about"}
        onClose={onClose}
        width={480}
        footer={
          <button type="button" className="btn btn-primary" onClick={onClose}>
            {t("close")}
          </button>
        }
      >
        <p className="studio-dialog-lead">
          {t.rich("aboutLead", { strong: (chunks) => <strong>{chunks}</strong> })}
        </p>
        <p className="studio-dialog-hint">
          {t("aboutHint")}
        </p>
        <nav className="studio-about-links" aria-label="3D Box Studio links">
          <ExternalLink href={SITE_ORIGIN_PUBLIC}>{t("website")}</ExternalLink>
          <ExternalLink href={`${SITE_ORIGIN_PUBLIC}/studio`}>{t("openStudio")}</ExternalLink>
          <ExternalLink href={`${SITE_ORIGIN_PUBLIC}/faq`}>FAQ</ExternalLink>
          <ExternalLink href={`${SITE_ORIGIN_PUBLIC}/blog`}>Blog</ExternalLink>
          <ExternalLink href={BUYMEACOFFEE_URL}>{t("buyMeACoffee")}</ExternalLink>
        </nav>
      </StudioDialog>

      <StudioDialog
        title={t("shareDialogTitle")}
        open={modal === "share-app"}
        onClose={onClose}
        footer={
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {t("cancel")}
            </button>
            <button type="button" className="btn" onClick={() => void copyAppLink()}>
              {t("copyLink")}
            </button>
            <button type="button" className="btn btn-primary" disabled={shareBusy} onClick={() => void shareApp()}>
              {shareBusy ? t("sharing") : t("share")}
            </button>
          </>
        }
      >
        <p className="studio-dialog-lead">
          {t("shareLead")}
        </p>
        <label className="studio-dialog-label" htmlFor="studio-app-share-url">
          {t("studioLink")}
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
            ? t("nativeShareHint")
            : t("copyHint")}
        </p>
      </StudioDialog>
    </>
  );
}
