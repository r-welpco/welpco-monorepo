"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface PaymentMethodFormProps {
  defaultValues?: Partial<PaymentMethodValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: PaymentMethodValues) => void | Promise<void>;
}

const schema = z.object({
  nameOnCard: z.string().min(2, "Name on card is required"),
  cardNumber: z.string().min(12, "Enter a valid card number"),
  expMonth: z.string().min(1, "MM").max(2, "MM"),
  expYear: z.string().min(2, "YY").max(4, "YYYY"),
  cvc: z.string().min(3, "CVC required").max(4),
  postalCode: z.string().min(3, "Postal code required"),
});

export type PaymentMethodValues = z.infer<typeof schema>;

export function PaymentMethodForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: PaymentMethodFormProps) {
  const form = useForm<PaymentMethodValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nameOnCard: "",
      cardNumber: "",
      expMonth: "",
      expYear: "",
      cvc: "",
      postalCode: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 640 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="4" trim="start" mb={FORM_SPACING.titleGap}>
            Add payment method
          </Heading>
          <Text size="2" color="gray" highContrast>
            Securely store a card for future payments.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="pm-name" mb={FORM_SPACING.labelGap}>
              Name on card
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="pm-name"
              placeholder="Alex Carter"
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("nameOnCard")}
            />
            {form.formState.errors.nameOnCard && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.nameOnCard.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="pm-number" mb={FORM_SPACING.labelGap}>
              Card number
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="pm-number"
              inputMode="numeric"
              placeholder="4242 4242 4242 4242"
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("cardNumber")}
            />
            {form.formState.errors.cardNumber && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.cardNumber.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="span" id="pm-exp-cvc-label" size="2" weight="bold" mb={FORM_SPACING.labelGap} style={{ display: "block" }}>
              Expiration & CVC
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <TextField.Root
                id="pm-exp-month"
                placeholder="MM"
                inputMode="numeric"
                maxLength={2}
                size="3"
                disabled={loading}
                aria-required="true"
                aria-label="Expiration month"
                aria-labelledby="pm-exp-cvc-label"
                style={{ flex: 1 }}
                {...form.register("expMonth")}
              />
              <TextField.Root
                id="pm-exp-year"
                placeholder="YYYY"
                inputMode="numeric"
                maxLength={4}
                size="3"
                disabled={loading}
                aria-required="true"
                aria-label="Expiration year"
                aria-labelledby="pm-exp-cvc-label"
                style={{ flex: 1 }}
                {...form.register("expYear")}
              />
              <TextField.Root
                id="pm-cvc"
                placeholder="CVC"
                inputMode="numeric"
                maxLength={4}
                size="3"
                disabled={loading}
                aria-required="true"
                aria-label="CVC"
                aria-labelledby="pm-exp-cvc-label"
                style={{ flex: 1 }}
                {...form.register("cvc")}
              />
            </Flex>
            {(form.formState.errors.expMonth || form.formState.errors.expYear || form.formState.errors.cvc) && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.expMonth?.message || form.formState.errors.expYear?.message || form.formState.errors.cvc?.message}
              </Text>
            )}
          </Box>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="pm-postal" mb={FORM_SPACING.labelGap}>
              Postal code
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="pm-postal"
              placeholder="94103"
              inputMode="numeric"
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("postalCode")}
            />
            {form.formState.errors.postalCode && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.postalCode.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Saving..." : "Save payment method"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
