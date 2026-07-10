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

export interface JobPostingFormProps {
  categories: { id: string; label: string }[];
  defaultValues?: Partial<JobPostingValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: JobPostingValues) => void | Promise<void>;
}

const schema = z.object({
  title: z.string().min(3, "Title is required"),
  categoryId: z.string().min(1, "Select a category"),
  budget: z.string().min(1, "Budget is required"),
  location: z.string().min(2, "Location is required"),
  description: z.string().min(10, "Describe the job"),
});

export type JobPostingValues = z.infer<typeof schema>;

export function JobPostingForm({
  categories,
  defaultValues,
  loading,
  error,
  onSubmit,
}: JobPostingFormProps) {
  const form = useForm<JobPostingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      categoryId: (categories && categories.length > 0) ? categories[0].id : "",
      budget: "",
      location: "",
      description: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit?.(values);
  });

  return (
    <Card size="4" variant="surface" style={{ width: "100%", maxWidth: 720 }}>
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            Create a job
          </Heading>
          <Text size="2" color="gray" highContrast>
            Describe the work so the right Welpers can apply.
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
            <Text as="label" size="2" weight="medium" htmlFor="job-title" mb={FORM_SPACING.labelGap}>
              Title
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="job-title"
              placeholder="Need a deep clean for 2-bedroom home"
              size="3"
              disabled={loading}
              aria-required="true"
              aria-invalid={form.formState.errors.title ? "true" : undefined}
              aria-describedby={form.formState.errors.title ? "job-title-error" : undefined}
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <Text id="job-title-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.title.message}
              </Text>
            )}
          </Box>

          <Box>
            <Text
              as="label"
              id="job-category-label"
              size="2"
              weight="medium"
              mb={FORM_SPACING.labelGap}
             style={{ display: "block" }}>
              Category
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Select
              size="3"
              value={form.watch("categoryId")}
              onValueChange={(value) => form.setValue("categoryId", value)}
              disabled={loading}
            >
              <SelectTrigger
                id="job-category"
                aria-labelledby="job-category-label"
                aria-invalid={form.formState.errors.categoryId ? "true" : undefined}
                aria-describedby={form.formState.errors.categoryId ? "job-category-error" : undefined}
                placeholder="Select category"
                style={{ width: "100%" }}
              />
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.categoryId && (
              <Text id="job-category-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.categoryId.message}
              </Text>
            )}
          </Box>

          <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="medium" htmlFor="job-budget" mb={FORM_SPACING.labelGap}>
                Budget
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="job-budget"
                placeholder="$200 – $400"
                size="3"
                disabled={loading}
                aria-required="true"
                aria-invalid={form.formState.errors.budget ? "true" : undefined}
                aria-describedby={form.formState.errors.budget ? "job-budget-error" : undefined}
                {...form.register("budget")}
              />
              {form.formState.errors.budget && (
                <Text id="job-budget-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.budget.message}
                </Text>
              )}
            </Box>
            <Box style={{ flex: 1 }}>
              <Text as="label" size="2" weight="medium" htmlFor="job-location" mb={FORM_SPACING.labelGap}>
                Location
                <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
              </Text>
              <TextField.Root
                id="job-location"
                placeholder="San Francisco, CA"
                size="3"
                disabled={loading}
                aria-required="true"
                aria-invalid={form.formState.errors.location ? "true" : undefined}
                aria-describedby={form.formState.errors.location ? "job-location-error" : undefined}
                {...form.register("location")}
              />
              {form.formState.errors.location && (
                <Text id="job-location-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                  {form.formState.errors.location.message}
                </Text>
              )}
            </Box>
          </Flex>

          <Box>
            <Text as="label" size="2" weight="medium" htmlFor="job-description" mb={FORM_SPACING.labelGap}>
              Description
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextArea
              id="job-description"
              rows={5}
              placeholder="Describe scope, timing, materials, and expectations."
              size="3"
              disabled={loading}
              aria-required="true"
              aria-invalid={form.formState.errors.description ? "true" : undefined}
              aria-describedby={form.formState.errors.description ? "job-description-error" : undefined}
              {...form.register("description")}
            />
            {form.formState.errors.description && (
              <Text id="job-description-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.description.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="3" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Posting…" : "Post job"}
          </Button>
          </form>
        </Flex>
      </Flex>
    </Card>
  );
}

