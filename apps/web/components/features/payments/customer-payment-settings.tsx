"use client";

import { useCallback, useState } from "react";
import { Box } from "@welpco/ui/box";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Skeleton } from "@welpco/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Elements } from "@stripe/react-stripe-js";
import {
  usePaymentMethods,
  useCreateSetupIntent,
  useSetDefaultPaymentMethod,
  useDetachPaymentMethod,
} from "@/lib/hooks/use-payments";
import { invalidateSetupChecklists } from "@/lib/hooks/use-signup";
import {
  DEFAULT_PAYMENT_METHOD_LABELS,
  PaymentMethodEmailVerificationDialog,
  SetupCardForm,
  stripePromise,
  usePaymentMethodWriteGuard,
  type CustomerPaymentMethodActionLabels,
} from "@/components/features/payments/add-payment-method-shared";

export type CustomerPaymentSettingsLabels = {
  title?: string;
  description?: string;
} & Partial<CustomerPaymentMethodActionLabels>;

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
  const { bookable, guardWrites } = usePaymentMethodWriteGuard();

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

  if (!stripePromise) {
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
        <PaymentMethodEmailVerificationDialog bookable={bookable} />
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
