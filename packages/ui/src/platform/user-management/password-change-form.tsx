"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { PasswordField } from "@welpco/ui/password-field";
import { Spinner } from "@welpco/ui/spinner";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type PasswordChangeFormLabels = {
  title: string;
  description: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  currentPasswordPlaceholder: string;
  newPasswordPlaceholder: string;
  confirmPasswordPlaceholder: string;
  passwordStrength: (label: string) => string;
  passwordStrengthWeak: string;
  passwordStrengthMedium: string;
  passwordStrengthStrong: string;
  submit: string;
  submitting?: string;
  validation: {
    currentRequired: string;
    newMin: string;
    confirmMin: string;
    mismatch: string;
    sameAsCurrent: string;
  };
};

export interface PasswordChangeFormProps {
  defaultValues?: Partial<PasswordChangeValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: PasswordChangeValues) => void | Promise<void>;
  labels?: PasswordChangeFormLabels;
}

function createSchema(v: PasswordChangeFormLabels["validation"]) {
  return z
    .object({
      currentPassword: z.string().min(1, v.currentRequired),
      newPassword: z.string().min(8, v.newMin),
      confirmPassword: z.string().min(8, v.confirmMin),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: v.mismatch,
      path: ["confirmPassword"],
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: v.sameAsCurrent,
      path: ["newPassword"],
    });
}

export type PasswordChangeValues = z.infer<ReturnType<typeof createSchema>>;

const DEFAULT_LABELS: PasswordChangeFormLabels = {
  title: "Change password",
  description: "Update your password to keep your account secure.",
  currentPassword: "Current password",
  newPassword: "New password",
  confirmPassword: "Confirm new password",
  currentPasswordPlaceholder: "Enter current password",
  newPasswordPlaceholder: "Enter new password",
  confirmPasswordPlaceholder: "Confirm new password",
  passwordStrength: (label) => `Password strength: ${label}`,
  passwordStrengthWeak: "Weak",
  passwordStrengthMedium: "Medium",
  passwordStrengthStrong: "Strong",
  submit: "Update password",
  submitting: "Updating...",
  validation: {
    currentRequired: "Current password is required",
    newMin: "Password must be at least 8 characters",
    confirmMin: "Confirm your password",
    mismatch: "Passwords must match",
    sameAsCurrent: "New password must be different from current password",
  },
};

export function PasswordChangeForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  labels: labelsProp,
}: PasswordChangeFormProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const schema = useMemo(() => createSchema(labels.validation), [labels.validation]);

  const form = useForm<PasswordChangeValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  const newPassword = form.watch("newPassword");
  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: "", color: SEMANTIC_COLOR.neutral };
    if (password.length < 8) return { strength: 1, label: labels.passwordStrengthWeak, color: SEMANTIC_COLOR.danger };
    if (password.length < 12) return { strength: 2, label: labels.passwordStrengthMedium, color: SEMANTIC_COLOR.warning };
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: labels.passwordStrengthStrong, color: SEMANTIC_COLOR.success };
    }
    return { strength: 2, label: labels.passwordStrengthMedium, color: SEMANTIC_COLOR.warning };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
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
            <Text as="label" size="2" weight="medium" htmlFor="current-password" mb={FORM_SPACING.labelGap}>
              {labels.currentPassword}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="current-password"
              placeholder={labels.currentPasswordPlaceholder}
              autoComplete="current-password"
              disabled={loading}
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.currentPassword ? true : undefined}
              aria-describedby={
                form.formState.errors.currentPassword
                  ? "current-password-error"
                  : undefined
              }
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword && (
              <Text id="current-password-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.currentPassword.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" htmlFor="new-password" mb={FORM_SPACING.labelGap}>
              {labels.newPassword}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="new-password"
              placeholder={labels.newPasswordPlaceholder}
              autoComplete="new-password"
              disabled={loading}
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.newPassword ? true : undefined}
              aria-describedby={
                form.formState.errors.newPassword ? "new-password-error" : undefined
              }
              {...form.register("newPassword")}
            />
            {newPassword && passwordStrength.label && (
              <Text size="1" color={passwordStrength.color as "red" | "amber" | "green" | "gray"} mt={FORM_SPACING.helperGap}>
                {labels.passwordStrength(passwordStrength.label)}
              </Text>
            )}
            {form.formState.errors.newPassword && (
              <Text id="new-password-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.newPassword.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="medium"
              htmlFor="confirm-password"
              mb={FORM_SPACING.labelGap}
            >
              {labels.confirmPassword}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="confirm-password"
              placeholder={labels.confirmPasswordPlaceholder}
              autoComplete="new-password"
              disabled={loading}
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.confirmPassword ? true : undefined}
              aria-describedby={
                form.formState.errors.confirmPassword
                  ? "confirm-password-error"
                  : undefined
              }
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <Text id="confirm-password-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.confirmPassword.message}
              </Text>
            )}
          </Box>

          <Button
            type="submit"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={loading}
            mt={FORM_SPACING.submitGap}
          >
            {loading ? <Spinner /> : labels.submit}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
