"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { hasFrenchPrefix } from "@/i18n/locale-routes";
import { usePathname } from "next/navigation";
import { Callout } from "@welpco/ui/callout";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

/**
 * Clears a broken session (authenticated in NextAuth but no API token) so the user
 * can sign in again instead of seeing a misleading "Signed in as" banner.
 */
export function RegisterStaleSessionGuard() {
  const { status, data: session } = useSession();
  const queryClient = useQueryClient();
  const pathname = usePathname() ?? "/";
  const t = useTranslations("auth.register.chrome");
  const clearedRef = useRef(false);

  const isStale =
    status === "authenticated" && !hasApiSession(status, session);

  useEffect(() => {
    if (!isStale || clearedRef.current) return;
    clearedRef.current = true;
    const loginPath = hasFrenchPrefix(pathname) ? "/fr/login" : "/login";
    void performClientSignOut({ callbackUrl: loginPath, queryClient });
  }, [isStale, pathname, queryClient]);

  if (!isStale) {
    return null;
  }

  return (
    <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
      <Flex direction="column" gap="2">
        <Callout.Text>{t("staleSessionMessage")}</Callout.Text>
        <Button
          size="2"
          variant="soft"
          onClick={() => {
            const loginPath = hasFrenchPrefix(pathname) ? "/fr/login" : "/login";
            void performClientSignOut({ callbackUrl: loginPath, queryClient });
          }}
        >
          {t("staleSessionAction")}
        </Button>
      </Flex>
    </Callout.Root>
  );
}
