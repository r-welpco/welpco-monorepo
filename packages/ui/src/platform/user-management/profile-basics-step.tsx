"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";

export interface ProfileBasicsStepProps {
  defaultValues?: Partial<ProfileBasicsValues>;
  onNext?: (values: ProfileBasicsValues) => void;
  onBack?: () => void;
  loading?: boolean;
}

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  phone: z.string().min(7, "Phone number is required"),
});

export type ProfileBasicsValues = z.infer<typeof schema>;

export function ProfileBasicsStep({
  defaultValues,
  onNext,
  onBack,
  loading,
}: ProfileBasicsStepProps) {
  const form = useForm<ProfileBasicsValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      ...defaultValues,
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onNext?.(values);
  });

  return (
    <form onSubmit={handleSubmit}>
      <Box mb={FORM_SPACING.fieldGap}>
        <Heading as="h3" size="3" mb="3" trim="start">
          Profile basics
        </Heading>
        <Text size="2" color="gray" highContrast>
          Tell us a bit about yourself. You can update this later.
        </Text>
      </Box>

      <Box mb={FORM_SPACING.fieldGap}>
        <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
          <Box style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium" htmlFor="first-name" mb={FORM_SPACING.labelGap}>
              First name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="first-name"
              placeholder="Jane"
              autoComplete="given-name"
              disabled={loading}
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.firstName ? "true" : undefined}
              aria-describedby={form.formState.errors.firstName ? "first-name-error" : undefined}
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName && (
              <Text id="first-name-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.firstName.message}
              </Text>
            )}
          </Box>

          <Box style={{ flex: 1 }}>
            <Text as="label" size="2" weight="medium" htmlFor="last-name" mb={FORM_SPACING.labelGap}>
              Last name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="last-name"
              placeholder="Doe"
              autoComplete="family-name"
              disabled={loading}
              size="2"
              aria-required="true"
              aria-invalid={form.formState.errors.lastName ? "true" : undefined}
              aria-describedby={form.formState.errors.lastName ? "last-name-error" : undefined}
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName && (
              <Text id="last-name-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
                {form.formState.errors.lastName.message}
              </Text>
            )}
          </Box>
        </Flex>
      </Box>

      <Box mb={FORM_SPACING.fieldGap}>
        <Text as="label" size="2" weight="medium" htmlFor="phone" mb={FORM_SPACING.labelGap}>
          Phone
          <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
        </Text>
        <TextField.Root
          id="phone"
          type="tel"
          inputMode="tel"
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
          disabled={loading}
          size="2"
          aria-required="true"
          aria-invalid={form.formState.errors.phone ? "true" : undefined}
          aria-describedby={form.formState.errors.phone ? "phone-error" : undefined}
          {...form.register("phone")}
        />
        {form.formState.errors.phone && (
          <Text id="phone-error" size="1" role="alert" color={SEMANTIC_COLOR.danger} mt={FORM_SPACING.helperGap}>
            {form.formState.errors.phone.message}
          </Text>
        )}
      </Box>

      <Flex gap="3" mt="3">
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            onClick={onBack}
            style={{ flex: 1 }}
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          color={SEMANTIC_COLOR.primary}
          size="2"
          disabled={loading}
          style={{ flex: 1 }}
        >
          Continue
        </Button>
      </Flex>
    </form>
  );
}
