"use client";

import { useEffect, useState } from "react";

/**
 * Client-side app origin without hardcoded domains: starts from the
 * build-time `NEXT_PUBLIC_APP_URL` (same value on server and client — no
 * hydration mismatch), then corrects to `window.location.origin` on mount so
 * previews/local dev always show the real host.
 */

function envOrigin(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  return raw.trim().replace(/\/+$/, "");
}

export function useAppOrigin(): { origin: string; host: string } {
  const [origin, setOrigin] = useState(envOrigin);

  useEffect(() => {
    if (typeof window !== "undefined" && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  return { origin, host: origin.replace(/^https?:\/\//i, "") };
}
