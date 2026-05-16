"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { ShieldCheck } from "lucide-react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useResendVerification } from "@/lib/hooks/use-resend-verification";

/**
 * Day 15 — Phase 3 of the signup ↔ onboarding merge.
 *
 * Sticky-but-dismissible callout that appears at the top of the dashboard
 * whenever the signed-in user hasn't verified their email yet. Customers and
 * Welpers can browse the dashboard freely; this banner reminds them that
 * bookable actions (creating a booking, configuring payouts, changing email)
 * are gated until they verify.
 *
 * Dismissal is per-render (clears on refresh) to avoid burying the warning
 * across sessions — verifying email is a real prerequisite for the user's
 * own success.
 */
export function VerificationBanner() {
  const { data: session } = useSession();
  const [dismissed, setDismissed] = useState(false);
  const [resendNote, setResendNote] = useState<string | null>(null);
  const resend = useResendVerification();

  const emailVerified = session?.user?.emailVerified === true;
  if (emailVerified || dismissed || !session?.user) {
    return null;
  }

  const handleResend = async () => {
    setResendNote(null);
    try {
      await resend.mutateAsync();
      setResendNote("Sent. Check your inbox in a minute or two.");
    } catch (err) {
      setResendNote(
        err instanceof Error
          ? err.message
          : "We couldn't resend the email. Try again in a moment.",
      );
    }
  };

  return (
    <Box mb="4">
      <Callout.Root color={SEMANTIC_COLOR.warning} variant="surface" role="status">
        <Callout.Icon>
          <ShieldCheck size={16} aria-hidden="true" />
        </Callout.Icon>
        <Flex
          direction={{ initial: "column", sm: "row" }}
          justify="between"
          align={{ initial: "start", sm: "center" }}
          gap="3"
          wrap="wrap"
          style={{ flex: 1 }}
        >
          <Box style={{ flex: 1, minWidth: 0 }}>
            <Text size="2" as="p" weight="bold">
              Verify your email to start booking and receiving payments.
            </Text>
            {resendNote ? (
              <Text
                size="1"
                as="p"
                color={resend.isError ? SEMANTIC_COLOR.danger : "gray"}
                mt="1"
              >
                {resendNote}
              </Text>
            ) : null}
          </Box>
          <Flex gap="2">
            <Button
              size="2"
              variant="soft"
              color={SEMANTIC_COLOR.primary}
              disabled={resend.isPending}
              onClick={handleResend}
            >
              {resend.isPending ? "Sending..." : "Resend verification"}
            </Button>
            <Button
              size="2"
              variant="ghost"
              color="gray"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss verification reminder"
            >
              Dismiss
            </Button>
          </Flex>
        </Flex>
      </Callout.Root>
    </Box>
  );
}
