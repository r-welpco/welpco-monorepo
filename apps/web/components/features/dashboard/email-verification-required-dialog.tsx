"use client";

import { useState } from "react";
import { ActionConfirmDialog } from "@welpco/ui/platform/feedback";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import {
  useDashboardCommonLabels,
  useEmailVerificationDialogLabels,
} from "@/lib/i18n/use-dashboard-labels";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import type {
  ResendVerificationHuman,
  ResendVerificationResult,
} from "@/lib/hooks/use-resend-verification";

export interface EmailVerificationRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email?: string;
  pending?: boolean;
  onResend: (human?: ResendVerificationHuman) => Promise<ResendVerificationResult>;
}

export function EmailVerificationRequiredDialog({
  open,
  onOpenChange,
  email,
  pending,
  onResend,
}: EmailVerificationRequiredDialogProps) {
  const labels = useEmailVerificationDialogLabels();
  const common = useDashboardCommonLabels();
  const target = email ?? labels.emailFallback;
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [turnstileError, setTurnstileError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  return (
    <ActionConfirmDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setTurnstileToken(null);
          setTurnstileError(null);
          setSendError(null);
          setSent(false);
          setSuccessMessage(null);
          setTurnstileResetKey((key) => key + 1);
        }
        onOpenChange(nextOpen);
      }}
      title={labels.title}
      description={
        <Flex direction="column" gap="3">
          {sent && successMessage ? (
            <Text size="2" color="green" highContrast as="p">
              {successMessage}
            </Text>
          ) : (
            <Text size="2" color="gray" highContrast as="p">
              {labels.description(target)}
            </Text>
          )}
          {sendError ? (
            <Text size="1" color="red" as="p">
              {sendError}
            </Text>
          ) : null}
          {!sent && turnstileEnabled ? (
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
      confirmLabel={sent ? labels.close : labels.resend}
      cancelLabel={labels.close}
      variant="primary"
      pending={pending}
      onConfirm={async () => {
        if (sent) {
          onOpenChange(false);
          return;
        }
        if (turnstileEnabled && !turnstileToken) {
          setTurnstileError(common.turnstileComplete);
          return;
        }
        setTurnstileError(null);
        setSendError(null);
        try {
          const result = await onResend({ turnstileToken: turnstileToken ?? undefined });
          setSent(true);
          setSuccessMessage(
            result.outcome === "sent" ? labels.sent : labels.alreadyVerified,
          );
        } catch (err) {
          setTurnstileResetKey((key) => key + 1);
          setTurnstileToken(null);
          setSendError(err instanceof Error ? err.message : labels.sendFailed);
        }
      }}
    />
  );
}
