"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextArea } from "@welpco/ui/text-area";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

export interface MatchingOfferingOption {
  id: string;
  hourlyRate: number;
  serviceDescription: string;
}

export interface JobApplicationFormLabels {
  title: string;
  subtitle: string;
  serviceOffering: string;
  selectOffering: string;
  selectOfferingError: string;
  yourRate: (rate: number) => string;
  proposalMessage: string;
  proposalPlaceholder: string;
  proposalMinError: string;
  submitting: string;
  submit: string;
}

const DEFAULT_FORM_LABELS: JobApplicationFormLabels = {
  title: "Submit application",
  subtitle: "Share a brief proposal. Your hourly rate comes from the selected offering.",
  serviceOffering: "Service offering",
  selectOffering: "Select offering",
  selectOfferingError: "Select an offering",
  yourRate: (rate) => `Your rate: $${rate}/hr`,
  proposalMessage: "Proposal message",
  proposalPlaceholder: "Explain your fit, relevant experience, and approach.",
  proposalMinError: "Provide at least 10 characters",
  submitting: "Submitting…",
  submit: "Submit application",
};

export interface JobApplicationFormProps {
  matchingOfferings: MatchingOfferingOption[];
  loading?: boolean;
  error?: string;
  onSubmit?: (values: JobApplicationValues) => void | Promise<void>;
  /** Render without the surrounding Card chrome and intro heading (e.g. inside a dialog). */
  embedded?: boolean;
  /** Set an id on the underlying <form> so an external submit button can drive it. */
  formId?: string;
  /** Hide the built-in submit button (use with `formId` + an external submit button). */
  hideSubmit?: boolean;
  labels?: JobApplicationFormLabels;
}

const schema = (labels: JobApplicationFormLabels) =>
  z.object({
    offeringId: z.string().min(1, labels.selectOfferingError),
    proposalMessage: z
      .string()
      .min(10, labels.proposalMinError)
      .max(2000),
  });

export type JobApplicationValues = z.infer<ReturnType<typeof schema>>;

export function JobApplicationForm({
  matchingOfferings,
  loading,
  error,
  onSubmit,
  embedded = false,
  formId,
  hideSubmit = false,
  labels: labelsProp,
}: JobApplicationFormProps) {
  const labels = labelsProp ?? DEFAULT_FORM_LABELS;
  const defaultOfferingId = matchingOfferings.length === 1 ? matchingOfferings[0]!.id : "";
  const form = useForm<JobApplicationValues>({
    resolver: zodResolver(schema(labels)),
    defaultValues: {
      offeringId: defaultOfferingId,
      proposalMessage: "",
    },
  });

  const selectedOfferingId = form.watch("offeringId");
  const selectedOffering = matchingOfferings.find((o) => o.id === selectedOfferingId);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  const body = (
      <Flex direction="column" gap="5">
        {!embedded && (
          <Box>
            <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
              {labels.title}
            </Heading>
            <Text size="2" color="gray" highContrast>
              {labels.subtitle}
            </Text>
          </Box>
        )}

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex asChild direction="column" gap="5">
          <form id={formId} onSubmit={handleSubmit}>
            {matchingOfferings.length > 1 && (
              <Box>
                <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap}>
                  {labels.serviceOffering}
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <Controller
                  control={form.control}
                  name="offeringId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                      <SelectTrigger placeholder={labels.selectOffering} />
                      <SelectContent>
                        {matchingOfferings.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {`${o.serviceDescription.slice(0, 60)} — $${o.hourlyRate}/hr`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.offeringId && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.offeringId.message}
                  </Text>
                )}
              </Box>
            )}

            {selectedOffering && (
              <Callout.Root color={SEMANTIC_COLOR.info} variant="surface">
                <Callout.Text>
                  {labels.yourRate(selectedOffering.hourlyRate)}
                </Callout.Text>
              </Callout.Root>
            )}

            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="application-proposal" mb={FORM_SPACING.labelGap}>
                {labels.proposalMessage}
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextArea
                id="application-proposal"
                rows={5}
                placeholder={labels.proposalPlaceholder}
                size="3"
                disabled={loading}
                aria-required="true"
                {...form.register("proposalMessage")}
              />
              {form.formState.errors.proposalMessage && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.proposalMessage.message}
                </Text>
              )}
            </Box>

            {!hideSubmit && (
              <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
                {loading ? labels.submitting : labels.submit}
              </Button>
            )}
          </form>
        </Flex>
      </Flex>
  );

  if (embedded) return body;

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 640 }}>
      {body}
    </Card>
  );
}
