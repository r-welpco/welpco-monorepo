import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { LocaleDocumentLang } from "@/components/providers/locale-document-lang";
import { readGeoFromHeaders } from "@/i18n/geo";
import {
  loadMessages,
  resolveLocaleFromCookie,
} from "@/lib/i18n/load-messages";

const LOCALE_COOKIE = "NEXT_LOCALE";

/**
 * Public `/welper/*` sits outside `app/[locale]`, but must honor the same
 * locale as marketing/dashboard (NEXT_LOCALE cookie, then geo).
 */
export default async function PublicWelperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const { country, region } = readGeoFromHeaders(await headers());
  const locale = resolveLocaleFromCookie(
    cookieStore.get(LOCALE_COOKIE)?.value,
    { country, region },
  );
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleDocumentLang locale={locale} />
      {children}
    </NextIntlClientProvider>
  );
}
