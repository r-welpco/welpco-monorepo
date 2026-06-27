"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement,
        options: {
          sitekey: string;
          action?: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove: (widgetId: string) => void;
    };
  }
}

const SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Turnstile failed to load")), {
        once: true,
      });
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = TURNSTILE_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Turnstile failed to load")), {
      once: true,
    });
    document.head.appendChild(script);
  });
}

export interface TurnstileWidgetProps {
  action: string;
  resetKey?: number;
  onToken: (token: string | null) => void;
  onError?: () => void;
  /** Localized message when the Turnstile script fails to load. */
  loadErrorMessage?: string;
}

export function TurnstileWidget({
  action,
  resetKey,
  onToken,
  onError,
  loadErrorMessage,
}: TurnstileWidgetProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let cancelled = false;
    let widgetId: string | null = null;
    onToken(null);
    setLoadError(false);

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => {
            onToken(null);
            onError?.();
          },
        });
      })
      .catch(() => {
        setLoadError(true);
        onToken(null);
        onError?.();
      });

    return () => {
      cancelled = true;
      if (widgetId && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, [action, onError, onToken, resetKey, siteKey]);

  if (!siteKey) return null;

  return (
    <div style={{ minHeight: 65 }}>
      <div ref={containerRef} />
      {loadError ? (
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "var(--red-11, #b42318)" }}>
          {loadErrorMessage ??
            "Human verification could not load. Check your connection and try again."}
        </p>
      ) : null}
    </div>
  );
}

export const HONEYPOT_FIELD_NAME = "website";

export function HoneypotField() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        left: "-10000px",
        top: "auto",
        width: 1,
        height: 1,
        overflow: "hidden",
      }}
    >
      <label htmlFor="website">Leave this field blank</label>
      <input
        id="website"
        name={HONEYPOT_FIELD_NAME}
        type="text"
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
