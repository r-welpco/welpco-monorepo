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

export type EmailUpdateFormLabels = {
  title: string;
  description: string;
  emailLabel: string;
  hint: string;
  submit: string;
  submitting?: string;
};

export interface EmailUpdateFormProps {
  defaultEmail?: string;
  loading?: boolean;
  error?: string;
  successMessage?: string;
  onSubmit?: (values: EmailUpdateValues) => void | Promise<void>;
  labels?: EmailUpdateFormLabels;
}

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

export type EmailUpdateValues = z.infer<typeof schema>;

export function EmailUpdateForm({
  defaultEmail = "",
  loading,
  error,
  successMessage,
  onSubmit,
  labels,
}: EmailUpdateFormProps) {
  const form = useForm<EmailUpdateValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: defaultEmail,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "100%", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels?.title ?? "Update email"}
          </Heading>
          <Text size="2" color="gray">
            {labels?.description ??
              "Change the email you sign in with. You'll need to verify the new address before your account is fully secured."}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {successMessage && (
          <Callout.Root color={SEMANTIC_COLOR.success} variant="surface">
            <Callout.Text>{successMessage}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="email-update" mb={FORM_SPACING.labelGap}>
              {labels?.emailLabel ?? "Email Address"}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="email-update"
              placeholder="your@email.com"
              size="2"
              disabled={loading}
              required
              aria-required="true"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.email.message}
              </Text>
            )}
            <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
              {labels?.hint ??
                "Your sign-in email changes right away. We'll ask you to verify the new address from the verification screen."}
            </Text>
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? (labels?.submitting ?? "Updating...") : (labels?.submit ?? "Update email")}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

