"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import {
  buildCtaContextFromPath,
  pathnameToSourcePageType,
  slugFromPath,
  trackStudioCtaClicked,
  type CtaLocation,
  type SourcePageType,
} from "@/lib/analytics";
import { preloadStudioChunk } from "@/lib/preloadStudio";

type StudioLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href?: ComponentProps<typeof Link>["href"];
  children: ReactNode;
  /** When set, fires studio_cta_clicked before navigation. */
  trackCta?: boolean;
  ctaLocation?: CtaLocation;
  sourcePageType?: SourcePageType;
  pageSlug?: string | null;
};

/** Studio navigation link that preloads the WebGL editor chunk on hover/focus. */
export default function StudioLink({
  children,
  href = "/studio",
  onClick,
  onMouseEnter,
  onFocus,
  trackCta = false,
  ctaLocation = "other",
  sourcePageType,
  pageSlug,
  ...props
}: StudioLinkProps) {
  const pathname = usePathname() ?? "/";
  const destination = typeof href === "string" ? href : "/studio";

  const handleCtaTrack = () => {
    if (!trackCta) return;
    const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/";
    trackStudioCtaClicked({
      sourcePageType: sourcePageType ?? pathnameToSourcePageType(path),
      pagePath: path,
      pageSlug: pageSlug ?? slugFromPath(path),
      ctaLocation,
      destination,
    });
  };

  return (
    <Link
      href={href}
      onClick={(event) => {
        handleCtaTrack();
        onClick?.(event);
      }}
      onMouseEnter={(event) => {
        preloadStudioChunk();
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        preloadStudioChunk();
        onFocus?.(event);
      }}
      {...props}
    >
      {children}
    </Link>
  );
}

export function trackStudioCtaFromPath(pathname: string, ctaLocation: CtaLocation, destination = "/studio"): void {
  trackStudioCtaClicked(buildCtaContextFromPath(pathname, ctaLocation, destination));
}
