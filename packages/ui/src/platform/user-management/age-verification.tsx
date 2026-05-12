"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";

export interface AgeVerificationProps {
  onAgeVerified?: (age: number, isMinor: boolean) => void | Promise<void>;
  loading?: boolean;
  error?: string;
}

const schema = z.object({
  dateOfBirth: z.string().min(1, "Date of birth is required"),
});

type AgeVerificationValues = z.infer<typeof schema>;

export function AgeVerification({
  onAgeVerified,
  loading,
  error,
}: AgeVerificationProps) {
  const [ageError, setAgeError] = useState<string | null>(null);
  const form = useForm<AgeVerificationValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dateOfBirth: "",
    },
  });

  const calculateAge = (dateOfBirth: string): number | null => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setAgeError(null);
    const age = calculateAge(values.dateOfBirth);

    if (age === null || age < 14) {
      setAgeError("You must be at least 14 years old to create a Welper account.");
      return;
    }

    if (age >= 18) {
      await onAgeVerified?.(age, false);
    } else if (age >= 14 && age < 18) {
      await onAgeVerified?.(age, true);
    }
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "520px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="4" trim="start" mb="1">
            Verify your age
          </Heading>
          <Text size="2" color="gray" highContrast>
            We need to verify your age to determine the registration process.
            Minors (14-17) require a guardian account.
          </Text>
        </Box>

        {(error || ageError) && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>{error || ageError}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <Box mb="3">
            <Text as="label" size="2" weight="bold" htmlFor="dob-field" mb="1">
              Date of birth
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1">*</Text>
            </Text>
            <TextField.Root
              id="dob-field"
              type="date"
              disabled={loading}
              size="2"
              {...form.register("dateOfBirth")}
            />
            {form.formState.errors.dateOfBirth && (
              <Text size="1" color={SEMANTIC_COLOR.danger} mt="2">
                {form.formState.errors.dateOfBirth.message}
              </Text>
            )}
          </Box>

          <Button
            type="submit"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={loading}
            mt="3"
          >
            {loading ? "Verifying..." : "Continue"}
          </Button>
        </form>
      </Flex>
    </Card>
  );
}

