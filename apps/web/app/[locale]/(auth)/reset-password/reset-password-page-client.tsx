"use client";

import { AuthBackground, PasswordReset } from "@welpco/ui/platform/user-management";
import { Card } from "@welpco/ui/card";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAppRouter } from "@/lib/i18n/use-app-router";
import { useTranslations } from "next-intl";
import { resetPassword } from "@/lib/services/user-service";
import type { PasswordResetValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";
import { usePasswordResetLabels } from "@/lib/i18n/use-auth-labels";

export default function ResetPasswordPageClient() {
  const router = useAppRouter();
  const searchParams = useSearchParams();
  const labels = usePasswordResetLabels();
  const t = useTranslations("auth.resetPassword");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";
  const nextRaw = searchParams.get("next");

  const handleSubmit = async (values: PasswordResetValues) => {
    if (!token) {
      setError(t("errors.invalidToken"));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await resetPassword(email || values.email, token, values.newPassword);
      setSuccess(true);

      setTimeout(() => {
        router.push(withNext("/login?passwordReset=success", nextRaw));
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("errors.resetFailed"));
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "480px", minWidth: 0 }}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Box>
              <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
                {t("invalidLinkTitle")}
              </Heading>
              <Text size="2" color="gray">
                {t("invalidLinkDescription")}
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
              <Callout.Text>{t("invalidLinkCallout")}</Callout.Text>
            </Callout.Root>
            <Flex justify="end">
              <Button
                color={SEMANTIC_COLOR.primary}
                onClick={() => router.push(withNext("/forgot-password", nextRaw))}
              >
                {t("requestNewLink")}
              </Button>
            </Flex>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  if (success) {
    return (
      <AuthBackground>
        <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "480px", minWidth: 0 }}>
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            <Box>
              <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
                {t("successTitle")}
              </Heading>
              <Text size="2" color="gray">
                {t("successRedirecting")}
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>{t("successCallout")}</Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <PasswordReset
        labels={labels}
        defaultValues={email ? { email } : undefined}
        loading={loading}
        error={error || undefined}
        onSubmit={handleSubmit}
        onCancel={() => router.push(withNext("/login", nextRaw))}
      />
    </AuthBackground>
  );
}
