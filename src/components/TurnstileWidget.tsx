"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { loadTurnstile } from "@/lib/loadTurnstile";
import { TURNSTILE_CONTACT_ACTION, turnstileSiteKey } from "@/lib/turnstile";

export type TurnstileWidgetHandle = {
  reset: () => void;
};

type TurnstileWidgetProps = {
  ref?: Ref<TurnstileWidgetHandle>;
  onToken: (token: string | null) => void;
  action?: string;
};

export default function TurnstileWidget({
  ref,
  onToken,
  action = TURNSTILE_CONTACT_ACTION,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  const siteKey = turnstileSiteKey();

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    },
  }));

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || widgetIdRef.current) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          action,
          appearance: "always",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "timeout-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => {
        if (!cancelled) onTokenRef.current(null);
      });

    return () => {
      cancelled = true;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = null;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [action, siteKey]);

  if (!siteKey) {
    if (process.env.NODE_ENV === "development") {
      return (
        <p className="contact-form-error" role="alert">
          Turnstile is not configured. Set NEXT_PUBLIC_TURNSTILE_SITE_KEY in .env.local, then
          restart the dev server.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="contact-turnstile" role="group" aria-label="Verification">
      <div ref={containerRef} />
    </div>
  );
}
