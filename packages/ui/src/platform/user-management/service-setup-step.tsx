"use client";

import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";

export interface ServiceSetupStepProps {
  defaultValues?: Partial<ServiceSetupValues>;
  onNext?: (values: ServiceSetupValues) => void;
  onBack?: () => void;
  loading?: boolean;
}

export interface ServiceSetupValues {
  hourlyRate?: string;
  serviceArea?: string;
  services?: string[];
}

export function ServiceSetupStep({
  defaultValues,
  onNext,
  onBack,
  loading,
}: ServiceSetupStepProps) {
  const [values, setValues] = useState<ServiceSetupValues>({
    hourlyRate: defaultValues?.hourlyRate || "",
    serviceArea: defaultValues?.serviceArea || "",
    services: defaultValues?.services || [],
  });

  const handleNext = () => {
    onNext?.(values);
  };

  return (
    <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
      <Box>
        <Heading as="h3" size="3" mb="3" trim="start">
          Service setup
        </Heading>
        <Text size="2" color="gray" highContrast>
          Set up your service details. You can update these later.
        </Text>
      </Box>

      <Box mb="3">
        <Text as="label" size="2" weight="bold" htmlFor="hourly-rate" mb="1">
          Hourly rate (optional)
        </Text>
        <TextField.Root
          id="hourly-rate"
          placeholder="e.g., 25"
          type="number"
          disabled={loading}
          size="2"
          value={values.hourlyRate}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              hourlyRate: (e.target as HTMLInputElement).value,
            }))
          }
        />
        <Text size="1" color="gray" mt="2" highContrast>
          You can set specific rates for each service later.
        </Text>
      </Box>

      <Box mb="3">
        <Text as="label" size="2" weight="bold" htmlFor="service-area" mb="1">
          Service area (optional)
        </Text>
        <TextField.Root
          id="service-area"
          placeholder="e.g., Downtown, City Center"
          disabled={loading}
          size="2"
          value={values.serviceArea}
          onChange={(e) =>
            setValues((prev) => ({
              ...prev,
              serviceArea: (e.target as HTMLInputElement).value,
            }))
          }
        />
        <Text size="1" color="gray" mt="2" highContrast>
          Where are you available to provide services?
        </Text>
      </Box>

      <Flex
        gap="2"
        justify="end"
        wrap="wrap"
        mt="3"
        direction={{ initial: "column", sm: "row" }}
      >
        {onBack && (
          <Button
            type="button"
            variant="ghost"
            color="gray"
            size="2"
            onClick={onBack}
            style={{ flex: 1, width: "100%", minWidth: 0 }}
          >
            Back
          </Button>
        )}
        <Button
          type="button"
          color={SEMANTIC_COLOR.primary}
          size="2"
          disabled={loading}
          onClick={handleNext}
          style={{ flex: 1, width: "100%", minWidth: 0 }}
        >
          Continue
        </Button>
      </Flex>
    </Flex>
  );
}

