"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { TextArea } from "@welpco/ui/text-area";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface GuardianAccountFormProps {
  defaultValues?: Partial<GuardianAccountFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: GuardianAccountFormValues) => void | Promise<void>;
}

const schema = z.object({
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianEmail: z.string().email("Enter a valid email"),
  relationship: z.string().min(2, "Relationship is required"),
  childName: z.string().min(2, "Child name is required"),
  notes: z.string().max(280, "Keep it brief").optional(),
});

export type GuardianAccountFormValues = z.infer<typeof schema>;

export function GuardianAccountForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: GuardianAccountFormProps) {
  const form = useForm<GuardianAccountFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      guardianName: "",
      guardianEmail: "",
      relationship: "",
      childName: "",
      notes: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(
    async (values: GuardianAccountFormValues) => {
      await onSubmit?.(values);
    }
  );

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Guardian account
          </Heading>
          <Text size="2" color="gray">
            Add a guardian to help manage bookings and approvals.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="guardian-name" mb={FORM_SPACING.labelGap}>
              Guardian name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="guardian-name"
              placeholder="Alex Smith"
              autoComplete="name"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("guardianName")}
            />
            {form.formState.errors.guardianName && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.guardianName.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="guardian-email" mb={FORM_SPACING.labelGap}>
              Guardian email
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="guardian-email"
              placeholder="guardian@example.com"
              autoComplete="email"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("guardianEmail")}
            />
            {form.formState.errors.guardianEmail && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.guardianEmail.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="guardian-rel" mb={FORM_SPACING.labelGap}>
              Relationship
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="guardian-rel"
              placeholder="Parent, sibling, caregiver..."
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("relationship")}
            />
            {form.formState.errors.relationship && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.relationship.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="guardian-child" mb={FORM_SPACING.labelGap}>
              Child name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="guardian-child"
              placeholder="Child name"
              size="2"
              aria-required="true"
              disabled={loading}
              {...form.register("childName")}
            />
            {form.formState.errors.childName && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.childName.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="guardian-notes" mb={FORM_SPACING.labelGap}>
              Notes (optional)
            </Text>
            <TextArea
              id="guardian-notes"
              rows={3}
              placeholder="Share preferences, schedules, or requirements"
              size="2"
              disabled={loading}
              {...form.register("notes")}
            />
            {form.formState.errors.notes && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.notes.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Saving..." : "Save guardian"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

