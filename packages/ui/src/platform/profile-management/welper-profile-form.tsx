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
export interface WelperProfileFormProps {
  defaultValues?: Partial<WelperProfileValues>;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: WelperProfileValues) => void | Promise<void>;
}

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(7, "Phone number is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters").max(600, "Keep your bio concise"),
  profileVisibility: z.enum(["Public", "Private"]),
  photoUrl: z.string().optional().nullable(),
});

export type WelperProfileValues = z.infer<typeof schema>;

export function WelperProfileForm({
  defaultValues,
  loading,
  error,
  onSubmit,
}: WelperProfileFormProps) {
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
            Welper profile
          </Heading>
          <Text size="2" color="gray">
            Set up your service profile so customers can book you. All fields marked with * are required.
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
                  First name
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
                  Last name
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
              Phone
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
              Bio
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextArea
              id="welper-bio"
              rows={5}
              placeholder="Describe your expertise, certifications, and approach. Minimum 50 characters."
              size="2"
              disabled={loading}
              aria-required="true"
              {...form.register("bio")}
            />
            {form.formState.errors.bio && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.bio.message}
              </Text>
            )}
            <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
              {form.watch("bio")?.length || 0} / 600 characters
            </Text>
          </Box>

          {/* Profile Visibility */}
          <Box mb={FORM_SPACING.fieldGap}>
            <Flex align="center" justify="between">
              <Box style={{ flex: 1 }}>
                <Text as="label" size="2" weight="bold" mb={FORM_SPACING.labelGap} id="wpf-visibility-label">
                  Profile visibility
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
              Public profiles are visible in search results. Private profiles are only visible to customers you've worked with.
            </Text>
            <Text size="1" color="gray" mt={FORM_SPACING.helperGap}>
              Current: {form.watch("profileVisibility")}
            </Text>
          </Box>

          <Button type="submit" size="2" color={SEMANTIC_COLOR.primary} disabled={loading} mt={FORM_SPACING.submitGap}>
            {loading ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}
