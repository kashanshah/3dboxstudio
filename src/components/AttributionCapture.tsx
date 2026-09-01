"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  attributionFromSearchParams,
  extractReferrerHost,
  hasMarketingSignals,
} from "@/lib/attribution";

/**
 * First-touch attribution capture. Stores UTMs, landing page, and referrer in an
 * httpOnly cookie via the server (preserved through signup).
 */
export default function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const capturedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const query = searchParams.toString();
    const captureKey = `${pathname}?${query}`;
    if (capturedKeyRef.current === captureKey) return;
    capturedKeyRef.current = captureKey;

    const fromUrl = attributionFromSearchParams(new URLSearchParams(query));
    const landingPage = pathname.slice(0, 500);
    const referrerHost = extractReferrerHost(document.referrer);

    const payload = {
      ...fromUrl,
      landingPage,
      referrerHost,
    };

    if (!hasMarketingSignals(payload) && !landingPage && !referrerHost) return;

    void fetch("/api/attribution/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      /* non-blocking */
    });
  }, [pathname, searchParams]);

  return null;
}
