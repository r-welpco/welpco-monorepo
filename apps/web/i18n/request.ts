import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = (await requestLocale) ?? routing.defaultLocale;
  const locale = routing.locales.includes(requested as "en" | "fr")
    ? (requested as "en" | "fr")
    : routing.defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return { locale, messages };
});
