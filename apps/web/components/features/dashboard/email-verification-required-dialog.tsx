"use client";

import { useState } from "react";
import { ActionConfirmDialog } from "@welpco/ui/platform/feedback";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { useEmailVerificationDialogLabels } from "@/lib/i18n/use-dashboard-labels";
import { useAuthStore } from "@/stores/authStore";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import type { ResendVerificationHuman } from "@/lib/hooks/use-resend-verification";

/**
 * Day 15 — Phase 3 of the signup ↔ onboarding merge.
 *
 * Focused dialog that surfaces when a bookable-action endpoint returns 403
 * with `code: 'EMAIL_VERIFICATION_REQUIRED'`. Wraps the canonical
 * `<ActionConfirmDialog>` (bible §17.6 + §25.4) — no bespoke modal here.
 *
 * Confirm verb is "Resend email"; cancel verb is "Close" (kept short to fit
 * mobile width per §22 voice).
 */
export interface EmailVerificationRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  pending?: boolean;
  onResend: (human?: ResendVerificationHuman) => void | Promise<void>;
}

export function EmailVerificationRequiredDialog({
  open,
  onOpenChange,
  email,
  pending,
  onResend,
}: EmailVerificationRequiredDialogProps) {
  const { user } = useAuthStore();
  const isWelper = user?.role === "welper";
  const labels = useEmailVerificationDialogLabels();
  const target = email ?? (isWelper ? labels.emailFallback : "your email address");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const bodyCopy = isWelper
    ? labels.description(target)
    : `Click the link we sent to ${target} to keep going. Need a new one? We'll send another.`;

  return (
    <ActionConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setTurnstileToken(null);
          setTurnstileError(null);
          setTurnstileResetKey((key) => key + 1);
        }
        onOpenChange(nextOpen);
      }}
      title={isWelper ? labels.title : "Verify your email"}
      description={
        <Flex direction="column" gap="3">
          <Text size="2" color="gray" highContrast as="p">
            {bodyCopy}
          </Text>
          {turnstileEnabled ? (
            <>
              <TurnstileWidget
                action="resend_verification"
                resetKey={turnstileResetKey}
                onToken={setTurnstileToken}
              />
              {turnstileError ? (
                <Text size="1" color="red" as="p">
                  {turnstileError}
                </Text>
              ) : null}
            </>
          ) : null}
        </Flex>
      }
      confirmLabel={isWelper ? labels.resend : "Resend email"}
      cancelLabel={isWelper ? labels.close : "Close"}
      variant="primary"
      pending={pending}
      onConfirm={async () => {
        if (turnstileEnabled && !turnstileToken) {
          setTurnstileError("Complete the human verification challenge.");
          return;
        }
        setTurnstileError(null);
        try {
          await onResend({ turnstileToken: turnstileToken ?? undefined });
        } catch {
          setTurnstileResetKey((key) => key + 1);
          setTurnstileToken(null);
        }
      }}
    />
  );
}
