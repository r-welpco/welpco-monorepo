"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { TextArea } from "@welpco/ui/text-area";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Welper-only step 3 of the unified signup wizard.
 *
 * Captures the public bio that renders in the Welper profile hero (Wave 1
 * trust signal). Floor matches the BFF DTO (≥ 120 chars, ≤ 2000) — anything
 * shorter reads as placeholder on the public page. Live char count keeps the
 * minimum visible without nagging.
 */

const MIN_BIO = 120;
const MAX_BIO = 2000;

const schema = z.object({
  bio: z
    .string()
    .trim()
    .min(MIN_BIO, `Bio must be at least ${MIN_BIO} characters`)
    .max(MAX_BIO, `Bio must be ${MAX_BIO} characters or fewer`),
});

export interface WelperBioStepValues {
  bio: string;
}

export interface WelperBioStepProps {
  state: SignupStateLite;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: WelperBioStepValues) => void | Promise<void>;
  onBack?: () => void;
}

export function WelperBioStep({
  state,
  loading,
  error,
  onSubmit,
  onBack,
}: WelperBioStepProps) {
  const filled = (state.filledData.welperBio as { bio?: string } | undefined)?.bio ?? "";

  const form = useForm<WelperBioStepValues>({
    resolver: zodResolver(schema),
    defaultValues: { bio: filled },
  });

  const bioValue = form.watch("bio") ?? "";
  const charCount = bioValue.trim().length;
  const remaining = MAX_BIO - bioValue.length;
  const meetsMin = charCount >= MIN_BIO;

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({ bio: values.bio.trim() });
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Tell customers who you are
          </Heading>
          <Text size="2" color="gray">
            A few sentences about your work, what you love about it, and who
            you&apos;re a great fit for. This is the first thing people read on
            your profile — speak in your own voice.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-bio"
              mb={FORM_SPACING.labelGap}
            >
              Your bio
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <TextArea
              id="signup-bio"
              placeholder="What do you do, who do you do it for, and why are you good at it?"
              rows={8}
              size="2"
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={form.formState.errors.bio ? true : undefined}
              aria-describedby="signup-bio-helper"
              {...form.register("bio")}
            />
            <Flex justify="between" align="center" mt={FORM_SPACING.helperGap}>
              <Text
                id="signup-bio-helper"
                size="1"
                color={meetsMin ? "gray" : SEMANTIC_COLOR.warning}
              >
                {meetsMin
                  ? `${charCount} characters`
                  : `${MIN_BIO - charCount} more to go (${MIN_BIO} min)`}
              </Text>
              <Text size="1" color={remaining < 100 ? SEMANTIC_COLOR.warning : "gray"}>
                {remaining} left
              </Text>
            </Flex>
            {form.formState.errors.bio && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.bio.message}
              </Text>
            )}
          </Box>

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? "Saving..." : "Continue"}
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={{ width: "100%" }}
              >
                Back
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
