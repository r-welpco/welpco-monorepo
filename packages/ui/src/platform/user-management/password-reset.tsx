"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  DEFAULT_PASSWORD_RESET_LABELS,
  type PasswordResetLabels,
} from "./signup-steps/labels";

export type { PasswordResetLabels } from "./signup-steps/labels";

export interface PasswordResetProps {
  defaultValues?: Partial<PasswordResetValues>;
  loading?: boolean;
  error?: string;
  labels?: PasswordResetLabels;
  onSubmit?: (values: PasswordResetValues) => void | Promise<void>;
  onCancel?: () => void;
}

function createSchema(labels: PasswordResetLabels) {
  return z
    .object({
      email: z.string().email(labels.validation.emailInvalid),
      newPassword: z.string().min(8, labels.validation.passwordMinLength),
      confirmPassword: z.string().min(8, labels.validation.confirmPasswordMinLength),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: labels.validation.passwordsMustMatch,
      path: ["confirmPassword"],
    });
}

export type PasswordResetValues = z.infer<ReturnType<typeof createSchema>>;

export function PasswordReset({
  defaultValues,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onCancel,
}: PasswordResetProps) {
  const labels = labelsProp ?? DEFAULT_PASSWORD_RESET_LABELS;
  const schema = useMemo(() => createSchema(labels), [labels]);

  const form = useForm<PasswordResetValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values: PasswordResetValues) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "520px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="reset-email" mb={FORM_SPACING.labelGap}>
              {labels.email}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <TextField.Root
              id="reset-email"
              placeholder={labels.emailPlaceholder}
              autoComplete="email"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.email.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="reset-password" mb={FORM_SPACING.labelGap}>
              {labels.newPassword}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <TextField.Root
              id="reset-password"
              type="password"
              placeholder={labels.passwordPlaceholder}
              autoComplete="new-password"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("newPassword")}
            />
            {form.formState.errors.newPassword && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.newPassword.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="reset-confirm"
              mb="1"
            >
              {labels.confirmPassword}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <TextField.Root
              id="reset-confirm"
              type="password"
              placeholder={labels.passwordPlaceholder}
              autoComplete="new-password"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.confirmPassword.message}
              </Text>
            )}
          </Box>

          <Flex gap="2" mt={FORM_SPACING.submitGap}>
            <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading}>
              {loading ? labels.updating : labels.updatePassword}
            </Button>
            {onCancel && (
              <Button type="button" size="2" variant="soft" color="gray" disabled={loading} onClick={onCancel}>
                {labels.cancel}
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
