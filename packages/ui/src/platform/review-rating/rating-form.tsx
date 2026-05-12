"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { TextArea } from "@welpco/ui/text-area";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useRef, useState, type KeyboardEvent } from "react";
import { StarIcon } from "@radix-ui/react-icons";

const COMMENT_MAX_LENGTH = 2000;
const COMMENT_COUNTER_THRESHOLD = Math.floor(COMMENT_MAX_LENGTH * 0.9);

export interface RatingFormProps {
  defaultValues?: Partial<RatingFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: RatingFormValues) => void | Promise<void>;
  /** Overrides default "Write a review" heading inside the card */
  heading?: string;
  /** Overrides default gray subheading */
  subheading?: string;
  /** Overrides default submit button label */
  submitLabel?: string;
}

const schema = z.object({
  rating: z.number().min(1, "Please select a rating").max(5),
  comment: z
    .string()
    .max(COMMENT_MAX_LENGTH, `Comment must be ${COMMENT_MAX_LENGTH} characters or fewer`)
    .superRefine((val, ctx) => {
      const t = val.trim();
      if (t.length === 0) return;
      if (t.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Comment must be at least 10 characters",
        });
      }
    }),
});

export type RatingFormValues = z.infer<typeof schema>;

export function RatingForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  heading = "Write a review",
  subheading = "Share your experience to help others.",
  submitLabel,
}: RatingFormProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const starRefs = useRef<Array<HTMLButtonElement | null>>([null, null, null, null, null]);
  const form = useForm<RatingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      rating: 0,
      comment: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  const currentRating = hoveredRating ?? form.watch("rating");

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 640 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {heading}
          </Heading>
          <Text size="2" color="gray">
            {subheading}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <Flex asChild direction="column" gap="5">
          <form onSubmit={handleSubmit}>
          <Box>
            <Text id="rating-group-label" as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap}>
              Rating
            </Text>
            <Controller
              control={form.control}
              name="rating"
              render={({ field }) => (
                <Flex
                  gap="1"
                  role="radiogroup"
                  aria-labelledby="rating-group-label"
                  aria-required="true"
                  aria-invalid={form.formState.errors.rating ? true : undefined}
                  onMouseLeave={() => setHoveredRating(null)}
                >
                  {[1, 2, 3, 4, 5].map((star) => {
                    const checked = field.value === star;
                    // Roving tabindex: only the selected (or first when none)
                    // star is tabbable; arrow keys move within the group.
                    const isFirstWhenNone = !field.value && star === 1;
                    const tabIndex = checked || isFirstWhenNone ? 0 : -1;

                    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
                        e.preventDefault();
                        const next = Math.min(5, star + 1);
                        field.onChange(next);
                        starRefs.current[next - 1]?.focus();
                      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
                        e.preventDefault();
                        const next = Math.max(1, star - 1);
                        field.onChange(next);
                        starRefs.current[next - 1]?.focus();
                      } else if (e.key === "Home") {
                        e.preventDefault();
                        field.onChange(1);
                        starRefs.current[0]?.focus();
                      } else if (e.key === "End") {
                        e.preventDefault();
                        field.onChange(5);
                        starRefs.current[4]?.focus();
                      } else if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        field.onChange(star);
                      }
                    };

                    return (
                      <IconButton
                        key={star}
                        ref={(el: HTMLButtonElement | null) => {
                          starRefs.current[star - 1] = el;
                        }}
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="3"
                        role="radio"
                        aria-checked={checked}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        tabIndex={tabIndex}
                        onClick={() => field.onChange(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onKeyDown={handleKeyDown}
                      >
                        <StarIcon
                          aria-hidden="true"
                          style={{
                            width: "32px",
                            height: "32px",
                            color:
                              star <= currentRating
                                ? "var(--amber-9)"
                                : "var(--gray-5)",
                          }}
                        />
                      </IconButton>
                    );
                  })}
                </Flex>
              )}
            />
            {form.formState.errors.rating && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.rating.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text as="label" size="2" weight="bold" htmlFor="comment-field" mb={FORM_SPACING.labelGap}>
              Comment (optional)
            </Text>
            <TextArea
              id="comment-field"
              placeholder="Tell us about your experience..."
              rows={4}
              size="3"
              maxLength={COMMENT_MAX_LENGTH}
              disabled={loading}
              {...form.register("comment")}
            />
            <Flex justify="between" align="center" mt={FORM_SPACING.helperGap} gap="2" wrap="wrap">
              {form.formState.errors.comment ? (
                <Text size="1" role="alert" color={SEMANTIC_COLOR.danger}>
                  {form.formState.errors.comment.message}
                </Text>
              ) : (
                <span />
              )}
              {(() => {
                const length = (form.watch("comment") ?? "").length;
                const remaining = COMMENT_MAX_LENGTH - length;
                if (length < COMMENT_COUNTER_THRESHOLD) return null;
                return (
                  <Text
                    size="1"
                    color="gray"
                    highContrast
                    aria-live="polite"
                  >
                    {remaining} characters left
                  </Text>
                );
              })()}
            </Flex>
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Submitting..." : submitLabel ?? "Submit review"}
          </Button>
          </form>
        </Flex>
      </Flex>
    </Card>
  );
}

