"use client";

import { useCallback } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { localeFromUseLocale } from "@/lib/i18n/app-locale";
import { updatePreferredLocale } from "@/lib/services/user-service";

export const DASHBOARD_LOCALES = ["en", "fr"] as const;
export type DashboardLocale = (typeof DASHBOARD_LOCALES)[number];

export const LOCALE_COOKIE = "NEXT_LOCALE";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Persist explicit user choice — geo defaults do not set this cookie. */
export function persistDashboardLocaleCookie(locale: DashboardLocale) {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};SameSite=Lax`;
}

/** Switch dashboard UI language via cookie + server refresh (unprefixed /dashboard routes). */
export function useDashboardLocale() {
  const locale = useLocale() as DashboardLocale;
  const router = useRouter();

  const setLocale = useCallback(
    (next: DashboardLocale) => {
      if (next === locale) return;
      persistDashboardLocaleCookie(next);
      void updatePreferredLocale(localeFromUseLocale(next)).catch(() => {
        // Non-blocking — cookie + refresh still apply
      });
      router.refresh();
    },
    [locale, router],
  );

  return { locale, setLocale };
}
