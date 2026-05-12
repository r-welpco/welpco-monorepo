"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { JobStatus, JobStatusBadge } from "./job-status-badge";

export interface JobCardProps {
  title: string;
  category: string;
  budget?: string;
  location?: string;
  createdAt?: string;
  status: JobStatus;
  description?: string;
  tags?: string[];
  onView?: () => void;
  onApply?: () => void;
}

export function JobCard({
  title,
  category,
  budget,
  location,
  createdAt,
  status,
  description,
  tags = [],
  onView,
  onApply,
}: JobCardProps) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="start" gap="3">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="4" trim="start" mb="1">
              {title}
            </Heading>
            <Flex gap="2" align="center" wrap="wrap">
              <Badge color="blue" variant="soft" size="1">
                {category}
              </Badge>
              {(budget || location || createdAt) && (
                <Text size="2" color="gray" highContrast>
                  {[
                    budget ? `Budget ${budget}` : null,
                    location ?? null,
                    createdAt ? `Posted ${createdAt}` : null,
                  ]
                    .filter(Boolean)
                    .join(" \u00B7 ")}
                </Text>
              )}
            </Flex>
          </Box>
          <JobStatusBadge status={status} />
        </Flex>

        {description && (
          <Text size="2" color="gray" highContrast>
            {description}
          </Text>
        )}

        {tags.length > 0 && (
          <Flex gap="2" wrap="wrap">
            {tags.map((tag) => (
              <Badge key={tag} variant="outline" color="gray">
                {tag}
              </Badge>
            ))}
          </Flex>
        )}

        {(onView || onApply) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onView && (
              <Button variant="ghost" color="gray" size="2" onClick={onView}>
                View
              </Button>
            )}
            {onApply && (
              <Button onClick={onApply} variant="solid" color={SEMANTIC_COLOR.primary} size="2">
                Apply
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

