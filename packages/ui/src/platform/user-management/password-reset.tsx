"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

export interface PasswordResetProps {
  defaultValues?: Partial<PasswordResetValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: PasswordResetValues) => void | Promise<void>;
  onCancel?: () => void;
}

const schema = z
  .object({
    email: z.string().email("Enter a valid email"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type PasswordResetValues = z.infer<typeof schema>;

export function PasswordReset({
  defaultValues,
  loading,
  error,
  onSubmit,
  onCancel,
}: PasswordResetProps) {
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
            Reset password
          </Heading>
          <Text size="2" color="gray">
            Enter your email and a new password.
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
              Email
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="reset-email"
              placeholder="you@example.com"
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
              New password
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="reset-password"
              type="password"
              placeholder="••••••••"
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
              Confirm password
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="reset-confirm"
              type="password"
              placeholder="••••••••"
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
              {loading ? "Updating..." : "Update password"}
            </Button>
            {onCancel && (
              <Button type="button" size="2" variant="soft" color="gray" disabled={loading} onClick={onCancel}>
                Cancel
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

