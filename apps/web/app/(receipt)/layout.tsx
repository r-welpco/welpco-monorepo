import { cookies, headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { readGeoFromHeaders } from "@/i18n/geo";
import { requireRole } from "@/lib/auth/server-auth";
import {
  loadMessages,
  resolveLocaleFromCookie,
} from "@/lib/i18n/load-messages";

const LOCALE_COOKIE = "NEXT_LOCALE";

export default async function ReceiptLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("customer");

  const cookieStore = await cookies();
  const { country, region } = readGeoFromHeaders(await headers());
  const locale = resolveLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value, {
    country,
    region,
  });
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
