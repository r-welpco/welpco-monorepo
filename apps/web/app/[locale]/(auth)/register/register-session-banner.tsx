"use client";

import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { SessionAccountBanner } from "@/lib/auth/session-account-banner";

type RegisterSessionBannerProps = {
  subtitle?: string;
};

export function RegisterSessionBanner({ subtitle }: RegisterSessionBannerProps) {
  const { data: session } = useSession();
  const t = useTranslations("auth.register.chrome");
  const email = session?.user?.email?.trim() ?? "";

  return (
    <SessionAccountBanner
      signedInAsLabel={t("signedInAs", { email })}
      useAnotherAccountLabel={t("useAnotherAccount")}
      subtitle={subtitle}
    />
  );
}
