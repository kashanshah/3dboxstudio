"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";
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

const CONFIG_ERROR_CODES = new Set(["110100", "110110", "110200", "400020", "400070"]);

function errorMessage(code?: string): string {
  if (code === "110200") {
    return "This domain is not allowed for the Turnstile site key. Add localhost (and your production host) in the Cloudflare Turnstile widget hostname list.";
  }
  if (code === "110100" || code === "110110" || code === "400020") {
    return "Turnstile site key is invalid. Check NEXT_PUBLIC_TURNSTILE_SITE_KEY.";
  }
  if (code === "400070") {
    return "This Turnstile site key is disabled in the Cloudflare dashboard.";
  }
  return "Verification failed to load. Refresh the page and try again.";
}

export default function TurnstileWidget({
  ref,
  onToken,
  action = TURNSTILE_CONTACT_ACTION,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [loadError, setLoadError] = useState<string | null>(null);

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
    setLoadError(null);

    void loadTurnstile()
      .then((turnstile) => {
        if (cancelled || !containerRef.current) return;
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }
        containerRef.current.replaceChildren();
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          size: "flexible",
          action,
          appearance: "always",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "timeout-callback": () => onTokenRef.current(null),
          "error-callback": (code) => {
            onTokenRef.current(null);
            if (!cancelled && code && CONFIG_ERROR_CODES.has(code)) {
              setLoadError(errorMessage(code));
            }
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        onTokenRef.current(null);
        setLoadError("Verification failed to load. Refresh the page and try again.");
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
      {loadError ? (
        <p className="contact-form-error" role="alert">
          {loadError}
        </p>
      ) : null}
    </div>
  );
}
