"use client";

import { useEffect } from "react";

const ENABLE_SW_IN_DEV = process.env.NEXT_PUBLIC_ENABLE_SW_IN_DEV === "true";

export function PwaServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production" && !ENABLE_SW_IN_DEV) return;

    let cancelled = false;

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });
        if (!cancelled) {
          registration.update().catch(() => undefined);
        }
      } catch {
        // Registration failure should never block the app shell.
      }
    }

    registerServiceWorker();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
