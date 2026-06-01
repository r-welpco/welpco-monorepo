"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { PasswordField } from "@welpco/ui/password-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export type PasswordChangeFormLabels = {
  title: string;
  description: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  submit: string;
  submitting?: string;
};

export interface PasswordChangeFormProps {
  defaultValues?: Partial<PasswordChangeValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: PasswordChangeValues) => void | Promise<void>;
  labels?: PasswordChangeFormLabels;
}

const schema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type PasswordChangeValues = z.infer<typeof schema>;

export function PasswordChangeForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  labels,
}: PasswordChangeFormProps) {
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
    if (password.length === 0) return { strength: 0, label: "", color: "gray" };
    if (password.length < 8) return { strength: 1, label: "Weak", color: "red" };
    if (password.length < 12) return { strength: 2, label: "Medium", color: "amber" };
    if (/[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: "Strong", color: "green" };
    }
    return { strength: 2, label: "Medium", color: "amber" };
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
            {labels?.title ?? "Change password"}
          </Heading>
          <Text size="2" color="gray">
            {labels?.description ?? "Update your password to keep your account secure."}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="current-password" mb={FORM_SPACING.labelGap}>
              {labels?.currentPassword ?? "Current password"}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="current-password"
              placeholder="Enter current password"
              autoComplete="current-password"
              disabled={loading}
              size="2"
              aria-required="true"
              {...form.register("currentPassword")}
            />
            {form.formState.errors.currentPassword && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.currentPassword.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="new-password" mb={FORM_SPACING.labelGap}>
              {labels?.newPassword ?? "New password"}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="new-password"
              placeholder="Enter new password"
              autoComplete="new-password"
              disabled={loading}
              size="2"
              aria-required="true"
              {...form.register("newPassword")}
            />
            {newPassword && passwordStrength.label && (
              <Text size="1" color={passwordStrength.color as "red" | "amber" | "green" | "gray"} mt={FORM_SPACING.helperGap}>
                Password strength: {passwordStrength.label}
              </Text>
            )}
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
              htmlFor="confirm-password"
              mb={FORM_SPACING.labelGap}
            >
              {labels?.confirmPassword ?? "Confirm new password"}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="confirm-password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              disabled={loading}
              size="2"
              aria-required="true"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
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
            {loading ? (labels?.submitting ?? "Updating...") : (labels?.submit ?? "Update password")}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

