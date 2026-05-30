"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Avatar } from "@welpco/ui/avatar";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { JobStatus, JobStatusBadge } from "./job-status-badge";

export type JobCardLayout = "list" | "grid";

export interface JobCardProps {
  title: string;
  category: string;
  budget?: string;
  location?: string;
  createdAt?: string;
  status: JobStatus;
  description?: string;
  tags?: string[];
  customerName?: string | null;
  customerPhotoUrl?: string | null;
  layout?: JobCardLayout;
  onView?: () => void;
  onApply?: () => void;
}

function customerInitials(name?: string | null): string {
  if (!name?.trim()) return "C";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function JobMetaLine({
  budget,
  location,
  createdAt,
}: Pick<JobCardProps, "budget" | "location" | "createdAt">) {
  const line = [
    budget ? `Budget ${budget}` : null,
    location ?? null,
    createdAt ? `Posted ${createdAt}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (!line) return null;

  return (
    <Text size="2" color="gray" highContrast>
      {line}
    </Text>
  );
}

function JobCardActions({ onView, onApply }: Pick<JobCardProps, "onView" | "onApply">) {
  if (!onView && !onApply) return null;

  return (
    <Flex gap="2" wrap="wrap" justify="end">
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
  );
}

function CustomerIdentity({
  customerName,
  customerPhotoUrl,
  compact = false,
}: {
  customerName?: string | null;
  customerPhotoUrl?: string | null;
  compact?: boolean;
}) {
  if (!customerName) return null;

  return (
    <Flex align="center" gap="2" style={{ minWidth: 0 }}>
      <Avatar
        size={compact ? "2" : "3"}
        src={customerPhotoUrl ?? undefined}
        fallback={customerInitials(customerName)}
        radius="full"
      />
      <Text size={compact ? "1" : "2"} weight="medium" truncate>
        {customerName}
      </Text>
    </Flex>
  );
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
  customerName,
  customerPhotoUrl,
  layout = "list",
  onView,
  onApply,
}: JobCardProps) {
  const tagBadges =
    tags.length > 0 ? (
      <Flex gap="2" wrap="wrap">
        {tags.map((tag) => (
          <Badge key={tag} variant="outline" color="gray">
            {tag}
          </Badge>
        ))}
      </Flex>
    ) : null;

  if (layout === "grid") {
    return (
      <Card size="3" variant="surface" style={{ width: "100%", height: "100%" }}>
        <Flex direction="column" gap="3" style={{ height: "100%" }}>
          <Flex justify="between" align="start" gap="2">
            <CustomerIdentity
              customerName={customerName}
              customerPhotoUrl={customerPhotoUrl}
              compact
            />
            <JobStatusBadge status={status} />
          </Flex>

          <Box style={{ minWidth: 0, flex: 1 }}>
            <Heading size="4" trim="start" mb="1">
              {title}
            </Heading>
            <Badge color="blue" variant="soft" size="1" mb="2">
              {category}
            </Badge>
            {description && (
              <Text size="2" color="gray" highContrast mb="1">
                {description}
              </Text>
            )}
            <JobMetaLine budget={budget} location={location} createdAt={createdAt} />
          </Box>

          {tagBadges}
          <JobCardActions onView={onView} onApply={onApply} />
        </Flex>
      </Card>
    );
  }

  return (
    <Card size="3" variant="surface" style={{ width: "100%" }}>
      <Flex direction="column" gap="3">
        <Flex
          direction={{ initial: "column", sm: "row" }}
          gap="4"
          align={{ sm: "start" }}
          justify="between"
        >
          <Flex gap="3" align="start" style={{ minWidth: 0, flex: 1 }}>
            {customerName && (
              <Box display={{ initial: "none", sm: "block" }} style={{ flexShrink: 0 }}>
                <CustomerIdentity customerName={customerName} customerPhotoUrl={customerPhotoUrl} />
              </Box>
            )}

            <Box style={{ minWidth: 0, flex: 1 }}>
              {customerName && (
                <Box display={{ initial: "block", sm: "none" }} mb="2">
                  <CustomerIdentity
                    customerName={customerName}
                    customerPhotoUrl={customerPhotoUrl}
                    compact
                  />
                </Box>
              )}
              <Flex justify="between" align="start" gap="3" mb="1">
                <Heading size="4" trim="start" style={{ flex: 1, minWidth: 0 }}>
                  {title}
                </Heading>
                <JobStatusBadge status={status} />
              </Flex>
              <Badge color="blue" variant="soft" size="1" mb="2">
                {category}
              </Badge>
              {description && (
                <Text size="2" color="gray" highContrast mb="1">
                  {description}
                </Text>
              )}
              <JobMetaLine budget={budget} location={location} createdAt={createdAt} />
            </Box>
          </Flex>

          <Box display={{ initial: "none", md: "block" }} style={{ flexShrink: 0 }}>
            <JobCardActions onView={onView} onApply={onApply} />
          </Box>
        </Flex>

        {tagBadges}

        <Box display={{ initial: "block", md: "none" }}>
          <JobCardActions onView={onView} onApply={onApply} />
        </Box>
      </Flex>
    </Card>
  );
}
