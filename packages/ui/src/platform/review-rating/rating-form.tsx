"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@welpco/ui/button";
import { IconButton } from "@welpco/ui/icon-button";
import { TextArea } from "@welpco/ui/text-area";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { StarIcon } from "@radix-ui/react-icons";

const COMMENT_MAX_LENGTH = 2000;
const COMMENT_COUNTER_THRESHOLD = Math.floor(COMMENT_MAX_LENGTH * 0.9);

export interface RatingFormLabels {
  ratingLabel: string;
  commentLabel: string;
  commentPlaceholder: string;
  starAria: (count: number) => string;
  starAriaPlural: (count: number) => string;
  charactersLeft: (count: number) => string;
  submit: string;
  submitting: string;
  validation: {
    ratingRequired: string;
    commentMin: string;
    commentMax: (max: number) => string;
  };
}

export interface RatingFormProps {
  defaultValues?: Partial<RatingFormValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: RatingFormValues) => void | Promise<void>;
  /** Overrides default submit button label */
  submitLabel?: string;
  /** @deprecated Use labels.commentPlaceholder */
  commentPlaceholder?: string;
  labels?: RatingFormLabels;
}

function createSchema(v: RatingFormLabels["validation"]) {
  return z.object({
    rating: z.number().min(1, v.ratingRequired).max(5),
    comment: z
      .string()
      .max(COMMENT_MAX_LENGTH, v.commentMax(COMMENT_MAX_LENGTH))
      .superRefine((val, ctx) => {
        const t = val.trim();
        if (t.length === 0) return;
        if (t.length < 10) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: v.commentMin,
          });
        }
      }),
  });
}

export type RatingFormValues = z.infer<ReturnType<typeof createSchema>>;

const DEFAULT_LABELS: RatingFormLabels = {
  ratingLabel: "Rating",
  commentLabel: "Comment (optional)",
  commentPlaceholder: "Tell us about your experience...",
  starAria: (count) => `Rate ${count} star`,
  starAriaPlural: (count) => `Rate ${count} stars`,
  charactersLeft: (count) => `${count} characters left`,
  submit: "Submit review",
  submitting: "Submitting...",
  validation: {
    ratingRequired: "Please select a rating",
    commentMin: "Comment must be at least 10 characters",
    commentMax: (max) => `Comment must be ${max} characters or fewer`,
  },
};

export function RatingForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  submitLabel,
  commentPlaceholder,
  labels: labelsProp,
}: RatingFormProps) {
  const labels = useMemo((): RatingFormLabels => {
    const base = labelsProp ?? DEFAULT_LABELS;
    if (!commentPlaceholder) return base;
    return { ...base, commentPlaceholder };
  }, [labelsProp, commentPlaceholder]);

  const schema = useMemo(() => createSchema(labels.validation), [labels.validation]);
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
    <Flex direction="column" gap="5" style={{ width: "100%" }}>
      {error && (
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      <Flex asChild direction="column" gap="5">
        <form onSubmit={handleSubmit}>
          <Box>
            <Text id="rating-group-label" as="label" size="2" weight="medium" mb={FORM_SPACING.labelGap}>
              {labels.ratingLabel}
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
                    const isFirstWhenNone = !field.value && star === 1;
                    const tabIndex = checked || isFirstWhenNone ? 0 : -1;
                    const starAriaLabel =
                      star > 1 ? labels.starAriaPlural(star) : labels.starAria(star);

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
                        aria-label={starAriaLabel}
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
            <Text as="label" size="2" weight="medium" htmlFor="comment-field" mb={FORM_SPACING.labelGap}>
              {labels.commentLabel}
            </Text>
            <TextArea
              id="comment-field"
              placeholder={labels.commentPlaceholder}
              rows={4}
              size="3"
              maxLength={COMMENT_MAX_LENGTH}
              disabled={loading}
              style={{ width: "100%" }}
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
                    {labels.charactersLeft(remaining)}
                  </Text>
                );
              })()}
            </Flex>
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? labels.submitting : (submitLabel ?? labels.submit)}
          </Button>
        </form>
      </Flex>
    </Flex>
  );
}

RatingForm.displayName = "RatingForm";
