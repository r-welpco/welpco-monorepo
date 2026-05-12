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

export interface JobApplicationFormProps {
  defaultValues?: Partial<JobApplicationValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: JobApplicationValues) => void | Promise<void>;
}

const schema = z.object({
  hourlyRate: z.coerce.number().min(0, "Rate must be positive"),
  availability: z.string().min(1, "Availability is required"),
  coverLetter: z.string().min(20, "Provide a short cover letter"),
});

export type JobApplicationValues = z.infer<typeof schema>;

export function JobApplicationForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: JobApplicationFormProps) {
  const form = useForm<JobApplicationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      hourlyRate: 60,
      availability: "",
      coverLetter: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 640 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Submit application
          </Heading>
          <Text size="2" color="gray" highContrast>
            Share your rate and a brief cover letter.
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
            <Text as="label" size="2" weight="bold" htmlFor="application-rate" mb={FORM_SPACING.labelGap}>
              Hourly rate ($)
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="application-rate"
              type="number"
              min={0}
              step="5"
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("hourlyRate", { valueAsNumber: true })}
            />
            {form.formState.errors.hourlyRate && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.hourlyRate.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="application-availability"
              mb={FORM_SPACING.labelGap}
            >
              Availability
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="application-availability"
              placeholder="e.g., Weekdays after 4pm, weekends flexible"
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("availability")}
            />
            {form.formState.errors.availability && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.availability.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="application-letter"
              mb={FORM_SPACING.labelGap}
            >
              Cover letter
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextArea
              id="application-letter"
              rows={5}
              placeholder="Explain your fit, relevant experience, and approach."
              size="3"
              disabled={loading}
              aria-required="true"
              {...form.register("coverLetter")}
            />
            {form.formState.errors.coverLetter && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.coverLetter.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Submitting…" : "Submit application"}
          </Button>
          </form>
        </Flex>
      </Flex>
    </Card>
  );
}

