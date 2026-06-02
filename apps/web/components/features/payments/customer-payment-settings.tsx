"use client";

import { useCallback, useState } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Box } from "@welpco/ui/box";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Skeleton } from "@welpco/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import {
  usePaymentMethods,
  useCreateSetupIntent,
  useSetDefaultPaymentMethod,
  useDetachPaymentMethod,
} from "@/lib/hooks/use-payments";
import { completeSetupIntent } from "@/lib/services/payment-service";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";
import { useBookableAction } from "@/lib/hooks/use-bookable-action";
import { EmailVerificationRequiredDialog } from "@/components/features/dashboard/email-verification-required-dialog";
import { EmailVerificationRequiredError } from "@/lib/api/client";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

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

const DEFAULT_PAYMENT_METHOD_LABELS: CustomerPaymentMethodActionLabels = {
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

export type CustomerPaymentSettingsLabels = {
  title?: string;
  description?: string;
} & Partial<CustomerPaymentMethodActionLabels>;

function SetupCardForm({
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
      <Flex direction="column" gap="4">
        <PaymentElement />
        {err ? (
          <Callout.Root color="red" variant="surface">
            <Callout.Text>{err}</Callout.Text>
          </Callout.Root>
        ) : null}
        <Flex gap="2" wrap="wrap">
          <Button type="submit" disabled={!stripe || busy} size="2">
            {busy ? labels.savingCard : labels.saveCard}
          </Button>
          <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={busy}>
            {labels.cancel}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

export function CustomerPaymentSettings({
  labels: labelsProp,
}: {
  labels?: CustomerPaymentSettingsLabels;
}) {
  const actionLabels: CustomerPaymentMethodActionLabels = {
    ...DEFAULT_PAYMENT_METHOD_LABELS,
    ...labelsProp,
  };
  const queryClient = useQueryClient();
  const { data: methods, isLoading, refetch } = usePaymentMethods(true);
  const createSi = useCreateSetupIntent();
  const setDefault = useSetDefaultPaymentMethod();
  const detach = useDetachPaymentMethod();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
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

  const startAddCard = useCallback(async () => {
    try {
      const res = await createSi.mutateAsync();
      if (res.clientSecret) setClientSecret(res.clientSecret);
    } catch (err) {
      if (guardWrites(err)) return;
      throw err;
    }
  }, [createSi, guardWrites]);

  const handleSetDefault = useCallback(
    (id: string) => {
      setDefault.mutate(id, {
        onError: (err) => {
          guardWrites(err);
        },
      });
    },
    [setDefault, guardWrites],
  );

  const handleDetach = useCallback(
    (id: string) => {
      detach.mutate(id, {
        onError: (err) => {
          guardWrites(err);
        },
      });
    },
    [detach, guardWrites],
  );

  const afterSave = useCallback(() => {
    setClientSecret(null);
    void refetch();
    void queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
    void invalidateSetupChecklists(queryClient);
  }, [refetch, queryClient]);

  if (!publishableKey || !stripePromise) {
    return (
      <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "560px" }}>
        <Callout.Root color="amber" variant="surface">
          <Callout.Text>{actionLabels.stripeNotConfigured}</Callout.Text>
        </Callout.Root>
      </Card>
    );
  }

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "560px" }}>
      <Flex direction="column" gap="5">
        <EmailVerificationRequiredDialog
          open={bookable.dialogOpen}
          onOpenChange={bookable.setDialogOpen}
          email={bookable.email}
          pending={bookable.resendPending}
          onResend={bookable.resend}
        />
        <Box>
          <Heading size="7" trim="start" mb="2">
            {labelsProp?.title ?? "Payment methods"}
          </Heading>
          <Text size="2" color="gray">
            {labelsProp?.description ??
              "Add a default card to complete your profile and authorize payment after a welper accepts your booking."}
          </Text>
        </Box>

        {isLoading ? (
          <Skeleton height="80px" style={{ borderRadius: "var(--radius-3)" }} />
        ) : methods && methods.length > 0 ? (
          <Flex direction="column" gap="3">
            {methods.map((m) => (
              <Flex
                key={m.id}
                align="center"
                justify="between"
                gap="3"
                wrap="wrap"
                p="3"
                style={{
                  border: "1px solid var(--gray-6)",
                  borderRadius: "var(--radius-3)",
                  background: "var(--gray-a2)",
                }}
              >
                <Text size="2">
                  {(m.brand ?? actionLabels.cardBrandFallback).toUpperCase()} ·••• {m.last4}
                  {m.isDefault ? (
                    <span
                      style={{
                        marginLeft: 8,
                        color: "var(--gray-10)",
                        fontSize: "var(--font-size-1)",
                      }}
                    >
                      {actionLabels.defaultBadge}
                    </span>
                  ) : null}
                </Text>
                <Flex gap="2" wrap="wrap">
                  {!m.isDefault ? (
                    <Button
                      size="1"
                      variant="soft"
                      onClick={() => handleSetDefault(m.id)}
                      disabled={setDefault.isPending}
                    >
                      {actionLabels.setDefault}
                    </Button>
                  ) : null}
                  <Button
                    size="1"
                    variant="outline"
                    color="red"
                    onClick={() => {
                      if (!window.confirm(actionLabels.removeConfirm)) return;
                      handleDetach(m.id);
                    }}
                    disabled={detach.isPending}
                  >
                    {actionLabels.remove}
                  </Button>
                </Flex>
              </Flex>
            ))}
          </Flex>
        ) : null}

        {!clientSecret ? (
          <Button
            size="2"
            variant="solid"
            onClick={() => void startAddCard()}
            disabled={createSi.isPending}
          >
            {createSi.isPending ? actionLabels.preparing : actionLabels.addPaymentMethod}
          </Button>
        ) : (
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
                onSuccess={afterSave}
                onCancel={() => setClientSecret(null)}
                labels={actionLabels}
              />
            </Elements>
          </Box>
        )}

        {createSi.isError ? (
          <Callout.Root color="red" variant="surface">
            <Callout.Text>
              {(createSi.error as Error)?.message ?? actionLabels.couldNotStartSetup}
            </Callout.Text>
          </Callout.Root>
        ) : null}
      </Flex>
    </Card>
  );
}
