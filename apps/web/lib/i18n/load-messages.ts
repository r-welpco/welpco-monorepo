import type { AbstractIntlMessages } from "next-intl";
import { resolveRequestLocale } from "@/i18n/resolve-locale";
import type { Locale } from "@/i18n/routing";

export function resolveLocaleFromCookie(
  cookieValue: string | undefined,
  geo?: { country?: string; region?: string },
): Locale {
  return resolveRequestLocale({
    cookieValue,
    country: geo?.country,
    region: geo?.region,
  });
}

export async function loadMessages(
  locale: Locale,
): Promise<AbstractIntlMessages> {
  const messages = (await import(`../../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;
  if (locale === "fr") {
    const serviceQuestionCopy = (
      await import("../../messages/service-question-copy.fr.json")
    ).default;
    const dashboard = (messages.dashboard ?? {}) as Record<string, unknown>;
    messages.dashboard = { ...dashboard, serviceQuestionCopy };
  }
  return messages as AbstractIntlMessages;
}
