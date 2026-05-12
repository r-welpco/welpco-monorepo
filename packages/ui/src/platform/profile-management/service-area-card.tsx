"use client";

import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { ServiceAreaSelector, type ServiceArea } from "./service-area-selector";

export interface ServiceAreaCardProps {
  defaultArea?: ServiceArea;
  loading?: boolean;
  onSave?: (area: ServiceArea) => void;
  error?: string;
}

export function ServiceAreaCard({
  defaultArea,
  loading,
  onSave,
  error,
}: ServiceAreaCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%", minWidth: 0, maxWidth: "640px" }}>
      <Flex direction="column" gap="3">
        <Box>
          <Heading size="4" trim="start" mb="1">
            Service Area
          </Heading>
          <Text size="2" color="gray" highContrast>
            Define the geographic area where you provide services. This helps customers find you when searching for services in their area.
          </Text>
        </Box>

        {error && (
          <Box>
            <Text size="1" color={SEMANTIC_COLOR.danger}>
              {error}
            </Text>
          </Box>
        )}

        <ServiceAreaSelector
          defaultArea={defaultArea}
          loading={loading}
          onSave={onSave}
          noCard={true}
        />
      </Flex>
    </Card>
  );
}
