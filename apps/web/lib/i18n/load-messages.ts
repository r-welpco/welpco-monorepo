import type { AbstractIntlMessages } from "next-intl";
import { routing, type Locale } from "@/i18n/routing";

export function resolveLocaleFromCookie(
  cookieValue: string | undefined,
): Locale {
  if (cookieValue === "fr" || cookieValue === "en") return cookieValue;
  return routing.defaultLocale;
}

export async function loadMessages(
  locale: Locale,
): Promise<AbstractIntlMessages> {
  const messages = (await import(`../../messages/${locale}.json`)).default;
  return messages as AbstractIntlMessages;
}
