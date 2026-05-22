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
import { Switch } from "@welpco/ui/switch";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import { z } from "zod";
import { WELPER_BIO_MAX_LENGTH, WELPER_BIO_MIN_LENGTH } from "./bio-limits";

export interface WelperProfileFormLabels {
  title: string;
  description: string;
  firstName: string;
  lastName: string;
  phone: string;
  bio: string;
  bioPlaceholder: string;
  charCount: (count: number) => string;
  visibility: string;
  visibilityHint: string;
  visibilityCurrent: (value: string) => string;
  save: string;
  saving: string;
}

export interface WelperProfileFormProps {
  defaultValues?: Partial<WelperProfileValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: WelperProfileValues) => void | Promise<void>;
  labels?: WelperProfileFormLabels;
  /** When false, hides the profile visibility switch (value still submitted from defaults). */
  showProfileVisibility?: boolean;
}

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(7, "Phone number is required"),
  bio: z
    .string()
    .min(
      WELPER_BIO_MIN_LENGTH,
      `Bio must be at least ${WELPER_BIO_MIN_LENGTH} characters`,
    )
    .max(WELPER_BIO_MAX_LENGTH, `Bio must be ${WELPER_BIO_MAX_LENGTH} characters or fewer`),
  profileVisibility: z.enum(["Public", "Private"]),
  photoUrl: z.string().optional().nullable(),
});

export type WelperProfileValues = z.infer<typeof schema>;

export function WelperProfileForm({
  defaultValues,
  loading,
  error,
  onSubmit,
  labels: labelsProp,
  showProfileVisibility = false,
}: WelperProfileFormProps) {
  const labels = labelsProp ?? {
    title: "Welper profile",
    description:
      "Set up your service profile so customers can book you. All fields marked with * are required.",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    bio: "Bio",
    bioPlaceholder:
      "Describe your expertise, certifications, and approach. Minimum 20 characters.",
    charCount: (count: number) => `${count} / ${WELPER_BIO_MAX_LENGTH} characters`,
    visibility: "Profile visibility",
    visibilityHint:
      "Public profiles are visible in search results. Private profiles are only visible to customers you've worked with.",
    visibilityCurrent: (value: string) => `Current: ${value}`,
    save: "Save profile",
    saving: "Saving...",
  };
  const form = useForm<WelperProfileValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      bio: "",
      profileVisibility: "Public",
      photoUrl: null,
      ...defaultValues,
    },
  });

  // Reset form when defaultValues change (e.g. after async profile fetch)
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        firstName: "",
        lastName: "",
        phone: "",
        bio: "",
        profileVisibility: "Public",
        photoUrl: null,
        ...defaultValues,
      });
    }
  }, [defaultValues, form]);

  const handleSubmit = form.handleSubmit(
    async (values: WelperProfileValues) => {
      await onSubmit?.(values);
    }
  );

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "640px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb={FORM_SPACING.fieldGap}>
            <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" htmlFor="welper-first-name" mb={FORM_SPACING.labelGap}>
                  {labels.firstName}
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <TextField.Root
                  id="welper-first-name"
                  placeholder="Alex"
                  autoComplete="given-name"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  {...form.register("firstName")}
                />
                {form.formState.errors.firstName && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.firstName.message}
                  </Text>
                )}
              </Box>

              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" htmlFor="welper-last-name" mb={FORM_SPACING.labelGap}>
                  {labels.lastName}
                  <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
                </Text>
                <TextField.Root
                  id="welper-last-name"
                  placeholder="Carter"
                  autoComplete="family-name"
                  size="2"
                  disabled={loading}
                  aria-required="true"
                  {...form.register("lastName")}
                />
                {form.formState.errors.lastName && (
                  <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                    {form.formState.errors.lastName.message}
                  </Text>
                )}
              </Box>
            </Flex>
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="welper-phone" mb={FORM_SPACING.labelGap}>
              {labels.phone}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="welper-phone"
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
              size="2"
              disabled={loading}
              aria-required="true"
              {...form.register("phone")}
            />
            {form.formState.errors.phone && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.phone.message}
              </Text>
            )}
          </Box>

          <Box mb={FORM_SPACING.fieldGap}>
            <Text as="label" size="2" weight="bold" htmlFor="welper-bio" mb={FORM_SPACING.labelGap}>
              {labels.bio}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextArea
              id="welper-bio"
              rows={5}
              placeholder={labels.bioPlaceholder}
              size="2"
              disabled={loading}
              maxLength={WELPER_BIO_MAX_LENGTH}
              aria-required="true"
              {...form.register("bio")}
            />
            {form.formState.errors.bio && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.bio.message}
              </Text>
            )}
            <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
              {labels.charCount(form.watch("bio")?.length || 0)}
            </Text>
          </Box>

          {showProfileVisibility ? (
            <Box mb={FORM_SPACING.fieldGap}>
              <Flex align="center" justify="between">
                <Box style={{ flex: 1 }}>
                  <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap} id="wpf-visibility-label">
                    {labels.visibility}
                  </Text>
                </Box>
                <Controller
                  name="profileVisibility"
                  control={form.control}
                  render={({ field }) => (
                    <Switch
                      aria-labelledby="wpf-visibility-label"
                      checked={field.value === "Public"}
                      onCheckedChange={(checked) =>
                        form.setValue("profileVisibility", checked ? "Public" : "Private")
                      }
                      disabled={loading}
                    />
                  )}
                />
              </Flex>
              <Text size="1" color="gray" mt={FORM_SPACING.labelGap}>
                {labels.visibilityHint}
              </Text>
              <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
                {labels.visibilityCurrent(form.watch("profileVisibility"))}
              </Text>
            </Box>
          ) : null}

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? labels.saving : labels.save}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
