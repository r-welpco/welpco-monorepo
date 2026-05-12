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
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  EvidenceUpload,
  type EvidenceUploadItem,
} from "./evidence-upload";

/** BFF caps (apps/bff/.../dto/create-dispute.dto.ts):
 *  - subject min 5 / max 255
 *  - description optional / max 5000
 *  Mirroring those caps on the FE so a paste of 5001 chars surfaces inline
 *  instead of a generic 400 from the server (bible §22.6: tell users what's
 *  going to happen before submit).
 */
export const DISPUTE_SUBJECT_MAX_LENGTH = 255;
export const DISPUTE_DESCRIPTION_MAX_LENGTH = 5000;

/**
 * DISPUTES-002 (Day 16): the canonical dispute category enum mirrors the BFF
 * `disputes.category` column verbatim — single source of truth lives in
 * `@welpco/types`. The form submits the BFF enum value; labels here are
 * display-only.
 *
 * Bible §22 voice — warm-direct, no jargon, severity-of-impact ordering. The
 * `safety` row deliberately reads short because it's reinforced by the
 * inline copy block when selected.
 */
export const DISPUTE_CATEGORIES = [
  "no_show",
  "quality",
  "overcharge",
  "safety",
  "other",
] as const;

export type DisputeFormCategory = (typeof DISPUTE_CATEGORIES)[number];

export const DISPUTE_CATEGORY_LABELS: Record<DisputeFormCategory, string> = {
  no_show: "Welper didn't show up",
  quality: "Service quality",
  overcharge: "Overcharged or unexpected fees",
  safety: "Safety concern",
  other: "Something else",
};

const schema = z.object({
  subject: z
    .string()
    .min(5, "Add a short summary — at least 5 characters.")
    .max(
      DISPUTE_SUBJECT_MAX_LENGTH,
      `Subject can be up to ${DISPUTE_SUBJECT_MAX_LENGTH} characters.`,
    ),
  category: z.enum(DISPUTE_CATEGORIES),
  description: z
    .string()
    .max(
      DISPUTE_DESCRIPTION_MAX_LENGTH,
      `Description can be up to ${DISPUTE_DESCRIPTION_MAX_LENGTH} characters.`,
    )
    .optional(),
});

export type DisputeFormValues = z.infer<typeof schema>;

export interface DisputeFormSubmitPayload extends DisputeFormValues {
  /** Successfully-uploaded evidence references; empty when nothing attached. */
  evidence: EvidenceUploadItem[];
}

export interface DisputeFormProps {
  defaultValues?: Partial<DisputeFormValues>;
  loading?: boolean;
  error?: string;
  /**
   * DISPUTES-001 (Day 16): when supplied, the form mounts `<EvidenceUpload>`
   * inline and routes per-file PUT uploads through this handler. Each
   * resolved `{key}` is collected and sent with the dispute create payload.
   * When omitted (e.g. tests, surfaces that don't support evidence yet) the
   * form renders without the uploader and submits with `evidence: []`.
   */
  uploadEvidence?: (file: File) => Promise<{ key: string }>;
  onSubmit?: (values: DisputeFormSubmitPayload) => void | Promise<void>;
}

export function DisputeForm({
  defaultValues,
  loading,
  error,
  uploadEvidence,
  onSubmit,
}: DisputeFormProps) {
  const form = useForm<DisputeFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      category: "other",
      description: "",
      ...defaultValues,
    },
  });
  const [evidence, setEvidence] = useState<EvidenceUploadItem[]>([]);

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.({ ...values, evidence });
  });

  const selectedCategory = form.watch("category");

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: "640px" }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Report a problem
          </Heading>
          <Text size="2" color="gray" highContrast>
            Tell us what happened. We read every report and will get back to you within 48 hours.
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
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="dispute-subject"
                mb={FORM_SPACING.labelGap}
              >
                Subject
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="dispute-subject"
                placeholder="A short summary of what went wrong"
                size="3"
                disabled={loading}
                aria-required="true"
                maxLength={DISPUTE_SUBJECT_MAX_LENGTH}
                {...form.register("subject")}
              />
              {form.formState.errors.subject && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.subject.message}
                </Text>
              )}
            </Box>

            <Box>
              <Text
                as="label"
                id="dispute-category-label"
                size="2"
                weight="bold"
                mb={FORM_SPACING.labelGap}
              >
                What kind of problem?
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <Select
                value={selectedCategory}
                onValueChange={(value: string) =>
                  form.setValue("category", value as DisputeFormCategory, {
                    shouldValidate: true,
                  })
                }
                disabled={loading}
              >
                <SelectTrigger
                  aria-labelledby="dispute-category-label"
                  aria-required="true"
                />
                <SelectContent>
                  {DISPUTE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {DISPUTE_CATEGORY_LABELS[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.category && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.category.message}
                </Text>
              )}
            </Box>

            {/* DISPUTES-002 (Day 16): safety category gets a separate
                copy block so the reporter knows the response window
                tightens AND is reminded to call 911 first if it's
                an active emergency. Bible §22.6 — say what's about to
                happen before they submit. */}
            {selectedCategory === "safety" && (
              <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="note">
                <Callout.Text>
                  <Text as="span" weight="bold">
                    If you&rsquo;re in immediate danger, call 911 first.
                  </Text>{" "}
                  We respond to safety reports within 4 hours and may contact
                  you directly.
                </Callout.Text>
              </Callout.Root>
            )}

            <Box>
              <Text
                as="label"
                size="2"
                weight="bold"
                htmlFor="dispute-description"
                mb={FORM_SPACING.labelGap}
              >
                What happened
              </Text>
              <TextArea
                id="dispute-description"
                placeholder="Tell us what happened, when, and how it affected you. The more specific, the faster we can help."
                rows={6}
                size="3"
                disabled={loading}
                maxLength={DISPUTE_DESCRIPTION_MAX_LENGTH}
                {...form.register("description")}
              />
              {form.formState.errors.description && (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.description.message}
                </Text>
              )}
            </Box>

            {/* DISPUTES-001 (Day 16): evidence picker mounted directly
                inside the form when the consumer wires an `uploadEvidence`
                handler. The handler does the BFF presign + S3 PUT;
                EvidenceUpload manages per-file UX. */}
            {uploadEvidence && (
              <EvidenceUpload
                uploadFile={uploadEvidence}
                onUploaded={setEvidence}
                disabled={loading}
              />
            )}

            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              mt={FORM_SPACING.submitGap}
            >
              {loading ? "Sending…" : "Send report"}
            </Button>
          </form>
        </Flex>
      </Flex>
    </Card>
  );
}

DisputeForm.displayName = "DisputeForm";
