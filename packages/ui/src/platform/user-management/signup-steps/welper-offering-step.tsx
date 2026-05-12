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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { Text } from "@welpco/ui/text";
import { TextArea } from "@welpco/ui/text-area";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch B. Welper-only step 5 of the unified signup wizard.
 *
 * One service offering: category + title (8–120) + hourlyRate (5–500) +
 * description (80–1000). Mirrors the BFF DTO bounds 1:1. Categories are passed
 * in by the wizard route so this primitive stays free of data-fetching.
 *
 * Helper line under the category sets expectations: "You can add more services
 * later from your profile." — closes the "but I have ten services!" anxiety.
 */

export interface WelperOfferingCategoryOption {
  id: string;
  name: string;
}

const schema = z.object({
  categoryId: z.string().min(1, "Pick a category"),
  title: z
    .string()
    .trim()
    .min(8, "Title must be at least 8 characters")
    .max(120, "Title must be 120 characters or fewer"),
  hourlyRate: z
    .number({ invalid_type_error: "Enter an hourly rate" })
    .min(5, "Hourly rate must be at least $5")
    .max(500, "Hourly rate must be $500 or less"),
  description: z
    .string()
    .trim()
    .min(80, "Description must be at least 80 characters")
    .max(1000, "Description must be 1000 characters or fewer"),
});

export interface WelperOfferingStepValues {
  categoryId: string;
  title: string;
  hourlyRate: number;
  description: string;
}

export interface WelperOfferingStepProps {
  state: SignupStateLite;
  categories: WelperOfferingCategoryOption[];
  categoriesLoading?: boolean;
  loading?: boolean;
  error?: string | null;
  onSubmit: (values: WelperOfferingStepValues) => void | Promise<void>;
  onBack?: () => void;
}

export function WelperOfferingStep({
  state,
  categories,
  categoriesLoading,
  loading,
  error,
  onSubmit,
  onBack,
}: WelperOfferingStepProps) {
  const filled = state.filledData.welperOffering as
    | Partial<WelperOfferingStepValues>
    | undefined;

  const form = useForm<WelperOfferingStepValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      categoryId: filled?.categoryId ?? "",
      title: filled?.title ?? "",
      hourlyRate: filled?.hourlyRate ?? 0,
      description: filled?.description ?? "",
    },
  });

  const descValue = form.watch("description") ?? "";
  const descCount = descValue.trim().length;

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      categoryId: values.categoryId,
      title: values.title.trim(),
      hourlyRate: Number(values.hourlyRate),
      description: values.description.trim(),
    });
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
            Add your first service
          </Heading>
          <Text size="2" color="gray">
            Pick the closest category and tell customers what you do, what it
            costs, and what they can expect. You can add more services later
            from your profile.
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
              id="signup-offering-category-label"
              size="2"
              weight="bold"
              mb={FORM_SPACING.labelGap}
            >
              Category
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <Select
              size="2"
              value={form.watch("categoryId")}
              disabled={loading || categoriesLoading}
              onValueChange={(value) =>
                form.setValue("categoryId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger
                aria-labelledby="signup-offering-category-label"
                placeholder={
                  categoriesLoading ? "Loading categories..." : "Choose a category"
                }
                style={{ width: "100%" }}
              />
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.categoryId.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-offering-title"
              mb={FORM_SPACING.labelGap}
            >
              Title
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <TextField.Root
              id="signup-offering-title"
              placeholder="Lawn mowing and yard cleanup"
              size="2"
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={form.formState.errors.title ? true : undefined}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.title.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-offering-rate"
              mb={FORM_SPACING.labelGap}
            >
              Hourly rate (USD)
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <TextField.Root
              id="signup-offering-rate"
              type="number"
              inputMode="decimal"
              step="0.01"
              min={5}
              max={500}
              placeholder="35"
              size="2"
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={form.formState.errors.hourlyRate ? true : undefined}
              {...form.register("hourlyRate", { valueAsNumber: true })}
            />
            {form.formState.errors.hourlyRate ? (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.hourlyRate.message}
              </Text>
            ) : (
              <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
                Between $5 and $500 per hour. You can adjust this anytime.
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text
              as="label"
              size="2"
              weight="bold"
              htmlFor="signup-offering-description"
              mb={FORM_SPACING.labelGap}
            >
              Description
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                *
              </Text>
            </Text>
            <TextArea
              id="signup-offering-description"
              placeholder="What's included? How long does it take? What gear do you bring?"
              rows={6}
              size="2"
              disabled={loading}
              required
              aria-required="true"
              aria-invalid={form.formState.errors.description ? true : undefined}
              {...form.register("description")}
            />
            {form.formState.errors.description ? (
              <Text
                role="alert"
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt={FORM_SPACING.helperGap}
              >
                {form.formState.errors.description.message}
              </Text>
            ) : (
              <Text
                size="1"
                color={descCount < 80 ? SEMANTIC_COLOR.warning : "gray"}
                mt={FORM_SPACING.helperGap}
              >
                {descCount < 80
                  ? `${80 - descCount} more characters to go (80 min)`
                  : `${descCount} characters`}
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
