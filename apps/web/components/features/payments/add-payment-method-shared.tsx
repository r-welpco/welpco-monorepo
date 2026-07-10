"use client";

import { useCallback, useEffect, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Skeleton } from "@welpco/ui/skeleton";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateSetupIntent } from "@/lib/hooks/use-payments";
import { completeSetupIntent } from "@/lib/services/payment-service";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { EmailVerificationRequiredError } from "@/lib/api/client";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
export const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

export type CustomerPaymentMethodActionLabels = {
  stripeNotConfigured: string;
  saveCard: string;
  savingCard: string;
  cancel: string;
  couldNotSaveCard: string;
  cardBrandFallback: string;
  defaultBadge: string;
  setDefault: string;
  remove: string;
  removeConfirm: string;
  addPaymentMethod: string;
  preparing: string;
  couldNotStartSetup: string;
};

export const DEFAULT_PAYMENT_METHOD_LABELS: CustomerPaymentMethodActionLabels = {
  stripeNotConfigured:
    "Card payments are not configured (missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY). Contact support if this persists.",
  saveCard: "Save card",
  savingCard: "Saving…",
  cancel: "Cancel",
  couldNotSaveCard: "Could not save card",
  cardBrandFallback: "Card",
  defaultBadge: "(default)",
  setDefault: "Set default",
  remove: "Remove",
  removeConfirm: "Remove this card?",
  addPaymentMethod: "Add payment method",
  preparing: "Preparing…",
  couldNotStartSetup: "Could not start card setup",
};

export function SetupCardForm({
  onSuccess,
  onCancel,
  labels,
}: {
  onSuccess: () => void;
  onCancel: () => void;
  labels: CustomerPaymentMethodActionLabels;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr(null);
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: typeof window !== "undefined" ? window.location.href.split("?")[0]! : "",
      },
      redirect: "if_required",
    });
    setBusy(false);
    if (error) {
      setErr(error.message ?? labels.couldNotSaveCard);
      return;
    }
    if (setupIntent?.id) {
      try {
        await completeSetupIntent(setupIntent.id);
      } catch (syncErr) {
        console.warn("Could not sync setup intent to server (webhook may still apply):", syncErr);
      }
    }
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap={FORM_SPACING.fieldGap}>
        <PaymentElement />
        {err ? (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{err}</Callout.Text>
          </Callout.Root>
        ) : null}
        <Flex gap="2" wrap="wrap">
          <Button type="submit" disabled={!stripe || busy} loading={busy} size="2">
            {labels.saveCard}
          </Button>
          <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={busy}>
            {labels.cancel}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

export function usePaymentMethodWriteGuard() {
  const bookable = useBookableAction();
  const guardWrites = useCallback(
    (err: unknown): boolean => {
      if (err instanceof EmailVerificationRequiredError) {
        bookable.setDialogOpen(true);
        return true;
      }
      return false;
    },
    [bookable],
  );
  return { bookable, guardWrites };
}

export function PaymentMethodEmailVerificationDialog({
  bookable,
}: {
  bookable: ReturnType<typeof useBookableAction>;
}) {
  return (
    <EmailVerificationRequiredDialog
      open={bookable.dialogOpen}
      onOpenChange={bookable.setDialogOpen}
      email={bookable.email}
      pending={bookable.resendPending}
      onResend={bookable.resend}
    />
  );
}

export function useInvalidateAfterPaymentSave() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["paymentMethods"] });
    void queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
    void invalidateSetupChecklists(queryClient);
  }, [queryClient]);
}

export interface AddPaymentMethodFormPanelProps {
  labels?: Partial<CustomerPaymentMethodActionLabels>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/** Inline Stripe add-card panel (setup intent + PaymentElement). */
export function AddPaymentMethodFormPanel({
  labels: labelsProp,
  onSuccess,
  onCancel,
}: AddPaymentMethodFormPanelProps) {
  const actionLabels: CustomerPaymentMethodActionLabels = {
    ...DEFAULT_PAYMENT_METHOD_LABELS,
    ...labelsProp,
  };
  const createSi = useCreateSetupIntent();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const { bookable, guardWrites } = usePaymentMethodWriteGuard();
  const invalidateAfterSave = useInvalidateAfterPaymentSave();

  const startAddCard = useCallback(async () => {
    try {
      const res = await createSi.mutateAsync();
      if (res.clientSecret) setClientSecret(res.clientSecret);
    } catch (err) {
      if (guardWrites(err)) return;
      throw err;
    }
  }, [createSi, guardWrites]);

  useEffect(() => {
    if (!clientSecret && !createSi.isPending && !createSi.isError) {
      void startAddCard();
    }
  }, [clientSecret, createSi.isPending, createSi.isError, startAddCard]);

  const handleSuccess = useCallback(() => {
    setClientSecret(null);
    invalidateAfterSave();
    onSuccess?.();
  }, [invalidateAfterSave, onSuccess]);

  const handleCancel = useCallback(() => {
    setClientSecret(null);
    onCancel?.();
  }, [onCancel]);

  if (!publishableKey || !stripePromise) {
    return (
      <Callout.Root color="amber" variant="surface">
        <Callout.Text>{actionLabels.stripeNotConfigured}</Callout.Text>
      </Callout.Root>
    );
  }

  return (
    <>
      <PaymentMethodEmailVerificationDialog bookable={bookable} />
      {createSi.isPending && !clientSecret ? (
        <Skeleton height="120px" style={{ borderRadius: "var(--radius-3)" }} />
      ) : null}
      {clientSecret ? (
        <Box
          p="4"
          style={{
            border: "1px solid var(--gray-6)",
            borderRadius: "var(--radius-3)",
            background: "var(--color-surface)",
          }}
        >
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: { theme: "stripe" },
            }}
          >
            <SetupCardForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
              labels={actionLabels}
            />
          </Elements>
        </Box>
      ) : null}
      {createSi.isError ? (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
          <Callout.Text>
            {(createSi.error as Error)?.message ?? actionLabels.couldNotStartSetup}
          </Callout.Text>
        </Callout.Root>
      ) : null}
    </>
  );
}

export interface AddPaymentMethodDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  title?: string;
  description?: string;
  labels?: Partial<CustomerPaymentMethodActionLabels>;
}

export function AddPaymentMethodDialog({
  open,
  onOpenChange,
  onSuccess,
  title = "Add payment method",
  description = "Add a card to authorize payment after a Welper accepts your booking.",
  labels,
}: AddPaymentMethodDialogProps) {
  const handleSuccess = useCallback(() => {
    onSuccess?.();
    onOpenChange(false);
  }, [onSuccess, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size="3"
        style={{ maxWidth: "min(480px, calc(100vw - 24px))" }}
        title={title}
        description={description}
      >
        {open ? (
          <AddPaymentMethodFormPanel
            labels={labels}
            onSuccess={handleSuccess}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
