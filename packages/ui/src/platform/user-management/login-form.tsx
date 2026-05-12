"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
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

export interface LoginFormProps {
  defaultValues?: Partial<LoginFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: LoginFormValues) => void | Promise<void>;
  onForgotPassword?: () => void;
  /** Optional "Don't have an account? Sign up" link rendered below the submit row. */
  onSignUp?: () => void;
}

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional().default(false),
});

export type LoginFormValues = z.infer<typeof schema>;

export function LoginForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  onForgotPassword,
  onSignUp,
}: LoginFormProps) {
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
            Welcome back
          </Heading>
          <Text size="2" color="gray">
            Sign in to continue.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="login-email" mb={FORM_SPACING.labelGap}>
              Email
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="login-email"
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

          <Box mb={FORM_SPACING.fieldGap} position="relative">
            <Flex align="baseline" justify="between" mb={FORM_SPACING.labelGap}>
              <Text as="label" size="2" weight="bold" htmlFor="login-password">
                Password
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
                  Forgot password?
                </Link>
              )}
            </Flex>
            <TextField.Root
              id="login-password"
              placeholder="••••••••"
              type="password"
              autoComplete="current-password"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
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
                Remember me
              </Text>
            </Flex>
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        {onSignUp && (
          <Flex align="center" justify="center" gap="2">
            <Text size="2" color="gray" highContrast>
              New to Welpco?
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
              Create an account
            </Link>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

