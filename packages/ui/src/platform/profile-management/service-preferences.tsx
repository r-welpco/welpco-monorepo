"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Checkbox } from "@welpco/ui/checkbox";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface ServicePreferencesProps {
  defaultValues?: Partial<ServicePreferencesValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: ServicePreferencesValues) => void | Promise<void>;
  serviceCategories?: Array<{ id: string; name: string }>;
}

const schema = z.object({
  preferredCategories: z.array(z.string()).min(1, "Select at least one preferred category"),
});

export type ServicePreferencesValues = z.infer<typeof schema>;

const defaultCategories = [
  { id: "home-cleaning", name: "Home Cleaning" },
  { id: "child-care", name: "Child Care" },
  { id: "pet-care", name: "Pet Care" },
  { id: "handyman", name: "Handyman" },
  { id: "tutoring", name: "Tutoring" },
  { id: "wellness", name: "Wellness" },
];

export function ServicePreferences({
  defaultValues,
  loading,
  error,
  onSubmit,
  serviceCategories = defaultCategories,
}: ServicePreferencesProps) {
  const form = useForm<ServicePreferencesValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      preferredCategories: [],
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit(
    async (values: ServicePreferencesValues) => {
      await onSubmit?.(values);
    }
  );

  const toggleCategory = (categoryId: string) => {
    const current = form.watch("preferredCategories");
    const updated = current.includes(categoryId)
      ? current.filter((id) => id !== categoryId)
      : [...current, categoryId];
    form.setValue("preferredCategories", updated);
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "720px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="7" trim="start" mb="2">
            Service preferences
          </Heading>
          <Text size="2" color="gray">
            Choose which types of services you want to see.
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="medium" mb={FORM_SPACING.labelGap}>
              Preferred service categories
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <Flex direction="column" gap="2">
              {serviceCategories.map((category) => (
                <Flex key={category.id} align="center" gap="3">
                  <Checkbox
                    checked={form.watch("preferredCategories").includes(category.id)}
                    onCheckedChange={() => toggleCategory(category.id)}
                    disabled={loading}
                    id={`category-${category.id}`}
                    size="2"
                  />
                  <Text as="label" size="2" htmlFor={`category-${category.id}`}>
                    {category.name}
                  </Text>
                </Flex>
              ))}
            </Flex>
            {form.formState.errors.preferredCategories && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.preferredCategories.message}
              </Text>
            )}
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Saving..." : "Save preferences"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
