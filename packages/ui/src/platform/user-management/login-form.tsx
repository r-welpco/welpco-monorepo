"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { PasswordField } from "@welpco/ui/password-field";
import { Spinner } from "@welpco/ui/spinner";
import { TextField } from "@welpco/ui/text-field";
import { Checkbox } from "@welpco/ui/checkbox";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Link } from "@welpco/ui/link";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  DEFAULT_LOGIN_FORM_LABELS,
  type LoginFormLabels,
} from "./signup-steps/labels";

export type { LoginFormLabels } from "./signup-steps/labels";

export interface LoginFormProps {
  defaultValues?: Partial<LoginFormValues>;
  loading?: boolean;
  error?: string;
  labels?: LoginFormLabels;
  onSubmit?: (values: LoginFormValues) => void | Promise<void>;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
}

function createSchema(labels: LoginFormLabels) {
  return z.object({
    email: z.string().email(labels.validation.emailInvalid),
    password: z.string().min(8, labels.validation.passwordMinLength),
    remember: z.boolean().optional().default(false),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createSchema>>;

export function LoginForm({
  defaultValues,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onForgotPassword,
  onSignUp,
}: LoginFormProps) {
  const labels = labelsProp ?? DEFAULT_LOGIN_FORM_LABELS;
  const schema = useMemo(() => createSchema(labels), [labels]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      remember: false,
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values: LoginFormValues) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "480px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.subtitle}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" htmlFor="login-email" mb={FORM_SPACING.labelGap}>
              {labels.email}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="login-email"
              placeholder={labels.emailPlaceholder}
              type="email"
              inputMode="email"
              autoComplete="email"
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.email ? true : undefined}
              aria-describedby={
                form.formState.errors.email ? "login-email-error" : undefined
              }
              disabled={loading}
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text id="login-email-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.email.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap} position="relative">
            <Flex align="baseline" justify="between" mb={FORM_SPACING.labelGap}>
              <Text as="label" size="2" weight="medium" htmlFor="login-password">
                {labels.password}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              {onForgotPassword && (
                <Link
                  size="2"
                  onClick={(e) => {
                    e.preventDefault();
                    onForgotPassword();
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {labels.forgotPassword}
                </Link>
              )}
            </Flex>
            <PasswordField
              id="login-password"
              placeholder={labels.passwordPlaceholder}
              autoComplete="current-password"
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.password ? true : undefined}
              aria-describedby={
                form.formState.errors.password ? "login-password-error" : undefined
              }
              disabled={loading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <Text id="login-password-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.password.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Flex align="center" gap="3">
              <Checkbox
                id="login-remember"
                checked={form.watch("remember")}
                onCheckedChange={(checked) =>
                  form.setValue("remember", Boolean(checked))
                }
                disabled={loading}
                size="2"
              />
              <Text as="label" size="2" htmlFor="login-remember">
                {labels.rememberMe}
              </Text>
            </Flex>
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? <Spinner /> : labels.signIn}
          </Button>
        </form>

        {onSignUp && (
          <Flex align="center" justify="center" gap="2">
            <Text size="2" color="gray" highContrast>
              {labels.newToWelpco}
            </Text>
            <Link
              size="2"
              weight="medium"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSignUp();
              }}
            >
              {labels.createAccount}
            </Link>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
