"use client";

import { useLocale, useMessages } from "next-intl";
import type en from "@/messages/en.json";

type CategoryNameMap = typeof en.auth.register.categoryNames;

/** Display name for a taxonomy category (English DB name → localized label). */
export function useCategoryDisplayName(): (englishName: string) => string {
  const locale = useLocale();
  const messages = useMessages() as unknown as typeof en;
  const map = messages.auth.register.categoryNames as CategoryNameMap;

  return (englishName: string) => {
    if (locale === "en") return englishName;
    return map[englishName as keyof CategoryNameMap] ?? englishName;
  };
}
