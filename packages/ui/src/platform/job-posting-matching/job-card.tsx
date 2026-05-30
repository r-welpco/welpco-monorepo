"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Avatar } from "@welpco/ui/avatar";
import { Separator } from "@welpco/ui/separator";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  CalendarDays,
  Clock,
  MapPin,
  Wallet,
  Users,
  CheckCircle2,
} from "lucide-react";
import type { ComponentType, CSSProperties, ReactNode } from "react";
import { JobStatus, JobStatusBadge } from "./job-status-badge";

export type JobCardLayout = "list" | "grid";

export interface JobCardProps {
  title: string;
  category: string;
  /** Human-readable scheduled date, e.g. "Tue, 4 Jun". */
  scheduledDate?: string;
  /** Human-readable scheduled time range, e.g. "09:00–11:00". */
  scheduledTime?: string;
  budget?: string;
  location?: string;
  createdAt?: string;
  status: JobStatus;
  description?: string;
  tags?: string[];
  /** Number of applications received — shown to the job owner. */
  applicationCount?: number;
  /** When true, renders an "Applied" indicator (welper has already applied). */
  applied?: boolean;
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

function MetaItem({
  icon: Icon,
  children,
}: {
  icon: ComponentType<{
    size?: number;
    "aria-hidden"?: boolean;
    style?: CSSProperties;
  }>;
  children: ReactNode;
}) {
  return (
    <Flex align="center" gap="2" style={{ minWidth: 0, color: "var(--gray-9)" }}>
      <Icon size={14} aria-hidden style={{ flexShrink: 0 }} />
      <Text size="2" color="gray" highContrast truncate>
        {children}
      </Text>
    </Flex>
  );
}

function JobMeta({
  scheduledDate,
  scheduledTime,
  budget,
  location,
}: Pick<JobCardProps, "scheduledDate" | "scheduledTime" | "budget" | "location">) {
  const hasAny = scheduledDate || scheduledTime || budget || location;
  if (!hasAny) return null;

  return (
    <Flex wrap="wrap" gapX="4" gapY="2">
      {scheduledDate && <MetaItem icon={CalendarDays}>{scheduledDate}</MetaItem>}
      {scheduledTime && <MetaItem icon={Clock}>{scheduledTime}</MetaItem>}
      {location && <MetaItem icon={MapPin}>{location}</MetaItem>}
      {budget && <MetaItem icon={Wallet}>{budget}</MetaItem>}
    </Flex>
  );
}

function JobCardActions({ onView, onApply }: Pick<JobCardProps, "onView" | "onApply">) {
  if (!onView && !onApply) return null;

  return (
    <Flex gap="2" wrap="wrap" justify="end" align="center">
      {onView && (
        <Button variant="soft" color="gray" size="2" onClick={onView}>
          View details
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

function FooterSignal({
  applicationCount,
  applied,
}: Pick<JobCardProps, "applicationCount" | "applied">) {
  if (applied) {
    return (
      <Flex align="center" gap="1" style={{ color: "var(--grass-11)" }}>
        <CheckCircle2 size={14} aria-hidden />
        <Text size="2" weight="medium">
          Applied
        </Text>
      </Flex>
    );
  }
  if (typeof applicationCount === "number") {
    return (
      <Flex align="center" gap="2" style={{ color: "var(--gray-11)" }}>
        <Users size={14} aria-hidden />
        <Text size="2" weight="medium">
          {applicationCount === 0
            ? "No applications yet"
            : `${applicationCount} application${applicationCount === 1 ? "" : "s"}`}
        </Text>
      </Flex>
    );
  }
  return null;
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
        size={compact ? "1" : "2"}
        src={customerPhotoUrl ?? undefined}
        fallback={customerInitials(customerName)}
        radius="full"
      />
      <Text size={compact ? "1" : "2"} color="gray" highContrast truncate>
        {customerName}
      </Text>
    </Flex>
  );
}

export function JobCard({
  title,
  category,
  scheduledDate,
  scheduledTime,
  budget,
  location,
  createdAt,
  status,
  description,
  tags = [],
  applicationCount,
  applied,
  customerName,
  customerPhotoUrl,
  onView,
  onApply,
}: JobCardProps) {
  const tagBadges =
    tags.length > 0 ? (
      <Flex gap="2" wrap="wrap">
        {tags.map((tag) => (
          <Badge key={tag} variant="soft" color="gray" radius="full">
            {tag}
          </Badge>
        ))}
      </Flex>
    ) : null;

  const hasFooterSignal = applied || typeof applicationCount === "number";
  const hasActions = Boolean(onView || onApply);
  const showFooter = hasFooterSignal || hasActions || Boolean(tagBadges);

  const header = (
    <Flex justify="between" align="start" gap="3">
      <Box style={{ minWidth: 0, flex: 1 }}>
        <Badge color="blue" variant="soft" size="1" radius="full" mb="2">
          {category}
        </Badge>
        <Heading size="4" trim="start">
          {title}
        </Heading>
      </Box>
      <Box style={{ flexShrink: 0 }}>
        <JobStatusBadge status={status} />
      </Box>
    </Flex>
  );

  const body = (
    <Flex direction="column" gap="3">
      {description && (
        <Text size="2" color="gray" highContrast>
          {description}
        </Text>
      )}
      <JobMeta
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        budget={budget}
        location={location}
      />
    </Flex>
  );

  const footer = showFooter ? (
    <Flex direction="column" gap="3">
      {tagBadges}
      <Separator size="4" />
      <Flex
        direction={{ initial: "column", xs: "row" }}
        gap="3"
        align={{ xs: "center" }}
        justify="between"
      >
        <Flex align="center" gap="3" style={{ minWidth: 0 }}>
          {customerName && (
            <>
              <CustomerIdentity
                customerName={customerName}
                customerPhotoUrl={customerPhotoUrl}
                compact
              />
              {hasFooterSignal && (
                <Box
                  display={{ initial: "none", sm: "block" }}
                  style={{ width: "1px", height: "16px", backgroundColor: "var(--gray-5)" }}
                />
              )}
            </>
          )}
          <FooterSignal applicationCount={applicationCount} applied={applied} />
          {createdAt && (
            <Text size="1" color="gray">
              Posted {createdAt}
            </Text>
          )}
        </Flex>
        <JobCardActions onView={onView} onApply={onApply} />
      </Flex>
    </Flex>
  ) : null;

  return (
    <Card size="3" variant="surface" style={{ width: "100%", height: "100%" }}>
      <Flex direction="column" gap="4" style={{ height: "100%" }}>
        {header}
        <Box style={{ flex: 1 }}>{body}</Box>
        {footer}
      </Flex>
    </Card>
  );
}

export function JobCardSkeleton({ layout = "list" }: { layout?: JobCardLayout }) {
  return (
    <Card size="3" variant="surface" style={{ width: "100%", height: "100%" }}>
      <Flex direction="column" gap="4">
        <Flex justify="between" align="start" gap="3">
          <Box style={{ flex: 1 }}>
            <Skeleton width="72px" height="20px" mb="2" />
            <Skeleton width="80%" height="24px" />
          </Box>
          <Skeleton width="64px" height="20px" />
        </Flex>
        <Flex gap="4" wrap="wrap">
          <Skeleton width="96px" height="16px" />
          <Skeleton width="80px" height="16px" />
          {layout === "list" && <Skeleton width="120px" height="16px" />}
        </Flex>
        <Separator size="4" />
        <Flex justify="between" align="center">
          <Skeleton width="120px" height="20px" />
          <Skeleton width="100px" height="32px" />
        </Flex>
      </Flex>
    </Card>
  );
}
