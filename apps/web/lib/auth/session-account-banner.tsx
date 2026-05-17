"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { performClientSignOut } from "@/lib/auth/client-sign-out";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { hasFrenchPrefix } from "@/i18n/locale-routes";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Link } from "@welpco/ui/link";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";

type SessionAccountBannerProps = {
  signedInAsLabel: string;
  useAnotherAccountLabel: string;
  subtitle?: string;
  /** Where to land after signing out (default: localized /login). */
  signOutCallbackUrl?: string;
};

/**
 * Shows the active account and a single sign-out action (login + register flows).
 */
export function SessionAccountBanner({
  signedInAsLabel,
  useAnotherAccountLabel,
  subtitle,
  signOutCallbackUrl,
}: SessionAccountBannerProps) {
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();
  const pathname = usePathname() ?? "/";

  if (!hasApiSession(status, session)) {
    return null;
  }

  const email = session?.user?.email?.trim();
  if (!email) {
    return null;
  }

  const defaultLoginPath = hasFrenchPrefix(pathname) ? "/fr/login" : "/login";
  const callbackUrl = signOutCallbackUrl ?? defaultLoginPath;

  return (
    <Callout.Root color={SEMANTIC_COLOR.info} variant="surface" role="status">
      <Flex direction="column" gap="1">
        <Callout.Text>
          <Text as="span" weight="medium">
            {signedInAsLabel}
          </Text>
        </Callout.Text>
        {subtitle ? (
          <Text size="2" color="gray">
            {subtitle}
          </Text>
        ) : null}
        <Link
          size="2"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            void performClientSignOut({ callbackUrl, queryClient });
          }}
          style={{ cursor: "pointer", alignSelf: "flex-start" }}
        >
          {useAnotherAccountLabel}
        </Link>
      </Flex>
    </Callout.Root>
  );
}
