"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
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
      <Box mb="3">
        <Heading as="h3" size="3" mb="3" trim="start">
          Profile basics
        </Heading>
        <Text size="2" color="gray" highContrast>
          Tell us a bit about yourself. You can update this later.
        </Text>
      </Box>

      <Box mb="3">
        <Flex gap="3" direction={{ initial: "column", sm: "row" }}>
          <Box style={{ flex: 1 }}>
            <Text as="label" size="2" weight="bold" htmlFor="first-name" mb="1">
              First name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="first-name"
              placeholder="Jane"
              autoComplete="given-name"
              disabled={loading}
              size="2"
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName && (
              <Text size="1" color={SEMANTIC_COLOR.danger} mt="2">
                {form.formState.errors.firstName.message}
              </Text>
            )}
          </Box>

          <Box style={{ flex: 1 }}>
            <Text as="label" size="2" weight="bold" htmlFor="last-name" mb="1">
              Last name
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
            </Text>
            <TextField.Root
              id="last-name"
              placeholder="Doe"
              autoComplete="family-name"
              disabled={loading}
              size="2"
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName && (
              <Text size="1" color={SEMANTIC_COLOR.danger} mt="2">
                {form.formState.errors.lastName.message}
              </Text>
            )}
          </Box>
        </Flex>
      </Box>

      <Box mb="3">
        <Text as="label" size="2" weight="bold" htmlFor="phone" mb="1">
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
          {...form.register("phone")}
        />
        {form.formState.errors.phone && (
          <Text size="1" color={SEMANTIC_COLOR.danger} mt="2">
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
