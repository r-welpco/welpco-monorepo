"use client";

import { useLocale } from "next-intl";
import { enUS, fr } from "date-fns/locale";
import type { Locale } from "date-fns";

export function useDateFnsLocale(): Locale {
  const locale = useLocale();
  return locale === "fr" ? fr : enUS;
}
