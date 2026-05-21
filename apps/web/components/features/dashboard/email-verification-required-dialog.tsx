"use client";

import { ActionConfirmDialog } from "@welpco/ui/platform/feedback";
import { useEmailVerificationDialogLabels } from "@/lib/i18n/use-dashboard-labels";
import { useAuthStore } from "@/stores/authStore";

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
  onResend: () => void | Promise<void>;
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

  return (
    <ActionConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isWelper ? labels.title : "Verify your email"}
      description={
        isWelper
          ? labels.description(target)
          : `Click the link we sent to ${target} to keep going. Need a new one? We'll send another.`
      }
      confirmLabel={isWelper ? labels.resend : "Resend email"}
      cancelLabel={isWelper ? labels.close : "Close"}
      variant="primary"
      pending={pending}
      onConfirm={async () => {
        await onResend();
      }}
    />
  );
}
