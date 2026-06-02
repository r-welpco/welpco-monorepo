import type { AbstractIntlMessages } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = (await requestLocale) ?? routing.defaultLocale;
  const locale = routing.locales.includes(requested as "en" | "fr")
    ? (requested as "en" | "fr")
    : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default as Record<
    string,
    unknown
  >;
  if (locale === "fr") {
    const serviceQuestionCopy = (
      await import("../messages/service-question-copy.fr.json")
    ).default;
    const dashboard = (messages.dashboard ?? {}) as Record<string, unknown>;
    messages.dashboard = { ...dashboard, serviceQuestionCopy };
  }
  return { locale, messages: messages as AbstractIntlMessages };
});
