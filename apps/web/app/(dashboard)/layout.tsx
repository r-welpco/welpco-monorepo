import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { requireOnboardingComplete } from "@/lib/auth/server-auth";
import {
  loadMessages,
  resolveLocaleFromCookie,
} from "@/lib/i18n/load-messages";
import DashboardLayoutClient from "./layout-client";

const LOCALE_COOKIE = "NEXT_LOCALE";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireOnboardingComplete();
  if (!user) return null;

  const cookieStore = await cookies();
  const locale = resolveLocaleFromCookie(cookieStore.get(LOCALE_COOKIE)?.value);
  const messages = await loadMessages(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <DashboardLayoutClient user={user}>{children}</DashboardLayoutClient>
    </NextIntlClientProvider>
  );
}
