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
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/services/user-service";
import type { PasswordResetValues } from "@welpco/ui/platform/user-management";
import { withNext } from "@/lib/auth/safe-next";

export default function ResetPasswordPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";
  const nextRaw = searchParams.get("next");

  const handleSubmit = async (values: PasswordResetValues) => {
    if (!token) {
      setError(
        "This reset link is invalid. Request a new one to continue."
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // The platform form collects email, but we already have it from the token
      // link. Trust the URL email so users can't reset arbitrary accounts via
      // this token.
      await resetPassword(email || values.email, token, values.newPassword);
      setSuccess(true);

      setTimeout(() => {
        router.push(withNext("/login?verified=true", nextRaw));
      }, 1500);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "We couldn't reset your password. The link may have expired — request a new one."
      );
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
                This reset link won&apos;t work
              </Heading>
              <Text size="2" color="gray">
                The link may be expired or already used. Request a new password reset and we&apos;ll
                send a fresh link.
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="alert">
              <Callout.Text>
                Reset links are valid for 30 minutes after they&apos;re issued.
              </Callout.Text>
            </Callout.Root>
            <Flex justify="end">
              <Button
                color={SEMANTIC_COLOR.primary}
                onClick={() => router.push(withNext("/forgot-password", nextRaw))}
              >
                Request a new link
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
                Your password is set
              </Heading>
              <Text size="2" color="gray">
                Taking you to sign in…
              </Text>
            </Box>
            <Callout.Root color={SEMANTIC_COLOR.success} variant="surface" role="status">
              <Callout.Text>You can now sign in with your new password.</Callout.Text>
            </Callout.Root>
          </Flex>
        </Card>
      </AuthBackground>
    );
  }

  return (
    <AuthBackground>
      <PasswordReset
        defaultValues={email ? { email } : undefined}
        loading={loading}
        error={error || undefined}
        onSubmit={handleSubmit}
        onCancel={() => router.push(withNext("/login", nextRaw))}
      />
    </AuthBackground>
  );
}
