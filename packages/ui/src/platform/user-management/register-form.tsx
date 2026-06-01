"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { PasswordField } from "@welpco/ui/password-field";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Select } from "@welpco/ui/select";
import { SelectTrigger } from "@welpco/ui/select";
import { SelectContent } from "@welpco/ui/select";
import { SelectItem } from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface RegisterFormProps {
  defaultValues?: Partial<RegisterFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: RegisterFormValues) => void | Promise<void>;
}

const schema = z
  .object({
    fullName: z.string().min(2, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
    role: z.enum(["customer", "welper"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof schema>;

export function RegisterForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: RegisterFormProps) {
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "customer",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values: RegisterFormValues) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "560px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Create your account
          </Heading>
          <Text size="2" color="gray">
            Choose your role to get the best experience.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="register-name" mb={FORM_SPACING.labelGap}>
              Full name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="register-name"
              placeholder="Jane Doe"
              autoComplete="name"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.fullName.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="register-email" mb={FORM_SPACING.labelGap}>
              Email
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="register-email"
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
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="register-password"
              mb={FORM_SPACING.labelGap}
            >
              Password
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="register-password"
              placeholder="••••••••"
              autoComplete="new-password"
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
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="register-confirm"
              mb={FORM_SPACING.labelGap}
            >
              Confirm password
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <PasswordField
              id="register-confirm"
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

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" id="register-role-label" size="2" weight="bold" mb={FORM_SPACING.labelGap}>
              Role
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Select
              onValueChange={(value) =>
                form.setValue("role", value as RegisterFormValues["role"])
              }
              value={form.watch("role")}
              disabled={loading}
            >
              <SelectTrigger id="register-role" aria-labelledby="register-role-label" placeholder="Select role" />
              <SelectContent>
                <SelectItem value="customer">Customer</SelectItem>
                <SelectItem value="welper">Welper (service provider)</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.role.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

