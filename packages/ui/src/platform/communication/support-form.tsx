"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface SupportFormProps {
  defaultValues?: Partial<SupportFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: SupportFormValues) => void | Promise<void>;
}

const schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  category: z.enum(["technical", "billing", "account", "other"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  message: z.string().min(20, "Message must be at least 20 characters"),
});

export type SupportFormValues = z.infer<typeof schema>;

export function SupportForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: SupportFormProps) {
  const form = useForm<SupportFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      category: "other",
      priority: "medium",
      message: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "640px" }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Contact support
          </Heading>
          <Text size="2" color="gray" highContrast>
            We'll get back to you as soon as possible.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex asChild direction="column" gap="5">
          <form onSubmit={handleSubmit}>
            <Box>
              <Text as="label" size="2" weight="medium" htmlFor="subject-field" mb={FORM_SPACING.labelGap}>
                Subject
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="subject-field"
                placeholder="Brief description of your issue"
                size="3"
                disabled={loading}
                aria-required="true"
                {...form.register("subject")}
              />
              {form.formState.errors.subject && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.subject.message}
                </Text>
              )}
            </Box>

            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <Box style={{ flex: 1 }}>
                <Text
                  as="label"
                  id="support-category-label"
                  size="2"
                  weight="medium"
                  mb={FORM_SPACING.labelGap}
                  style={{ display: "block" }}
                >
                  Category
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <Select
                  value={form.watch("category")}
                  onValueChange={(value: string) =>
                    form.setValue("category", value as SupportFormValues["category"])
                  }
                  disabled={loading}
                >
                  <SelectTrigger aria-labelledby="support-category-label" style={{ width: "100%" }} />
                  <SelectContent>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.category && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.category.message}
                  </Text>
                )}
              </Box>

              <Box style={{ flex: 1 }}>
                <Text
                  as="label"
                  id="support-priority-label"
                  size="2"
                  weight="medium"
                  mb={FORM_SPACING.labelGap}
                  style={{ display: "block" }}
                >
                  Priority
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <Select
                  value={form.watch("priority")}
                  onValueChange={(value: string) =>
                    form.setValue("priority", value as SupportFormValues["priority"])
                  }
                  disabled={loading}
                >
                  <SelectTrigger aria-labelledby="support-priority-label" style={{ width: "100%" }} />
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.priority && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.priority.message}
                  </Text>
                )}
              </Box>
            </Flex>

            <Box>
              <Text as="label" size="2" weight="medium" htmlFor="message-field" mb={FORM_SPACING.labelGap}>
                Message
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextArea
                id="message-field"
                placeholder="Describe your issue in detail…"
                rows={6}
                size="3"
                disabled={loading}
                aria-required="true"
                {...form.register("message")}
              />
              {form.formState.errors.message && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.message.message}
                </Text>
              )}
            </Box>

            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              mt={FORM_SPACING.submitGap}
            >
              {loading ? "Submitting…" : "Submit ticket"}
            </Button>
          </form>
        </Flex>
      </Flex>
    </Card>
  );
}

SupportForm.displayName = "SupportForm";
