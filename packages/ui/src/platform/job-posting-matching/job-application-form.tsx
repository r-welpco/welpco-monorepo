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

export interface JobApplicationFormProps {
  matchingOfferings: MatchingOfferingOption[];
  loading?: boolean;
  error?: string;
  onSubmit?: (values: JobApplicationValues) => void | Promise<void>;
}

const schema = z.object({
  offeringId: z.string().min(1, "Select an offering"),
  proposalMessage: z.string().min(10, "Provide at least 10 characters").max(2000),
});

export type JobApplicationValues = z.infer<typeof schema>;

export function JobApplicationForm({
  matchingOfferings,
  loading,
  error,
  onSubmit,
}: JobApplicationFormProps) {
  const defaultOfferingId = matchingOfferings.length === 1 ? matchingOfferings[0]!.id : "";
  const form = useForm<JobApplicationValues>({
    resolver: zodResolver(schema),
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

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 640 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Submit application
          </Heading>
          <Text size="2" color="gray" highContrast>
            Share a brief proposal. Your hourly rate comes from the selected offering.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex asChild direction="column" gap="5">
          <form onSubmit={handleSubmit}>
            {matchingOfferings.length > 1 && (
              <Box>
                <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap}>
                  Service offering
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <Controller
                  control={form.control}
                  name="offeringId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                      <SelectTrigger placeholder="Select offering" />
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
              <Callout.Root color="blue" variant="surface">
                <Callout.Text>
                  {`Your rate: $${selectedOffering.hourlyRate}/hr`}
                </Callout.Text>
              </Callout.Root>
            )}

            <Box>
              <Text as="label" size="2" weight="bold" htmlFor="application-proposal" mb={FORM_SPACING.labelGap}>
                Proposal message
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextArea
                id="application-proposal"
                rows={5}
                placeholder="Explain your fit, relevant experience, and approach."
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

            <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
              {loading ? "Submitting…" : "Submit application"}
            </Button>
          </form>
        </Flex>
      </Flex>
    </Card>
  );
}
