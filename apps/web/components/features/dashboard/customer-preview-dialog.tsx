"use client";

import type { CSSProperties } from "react";
import {
  Star,
  CalendarDays,
  Briefcase,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";
import { Dialog as RadixDialog } from "@radix-ui/themes";
import { Avatar } from "@welpco/ui/avatar";
import { Badge } from "@welpco/ui/badge";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Skeleton } from "@welpco/ui/skeleton";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useCustomerPublicSummary } from "@/lib/hooks/use-customer-summary";
import { useCustomerPreviewLabels } from "@/lib/i18n/use-dashboard-labels";

export interface CustomerPreviewDialogProps {
  customerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Shown while loading or if the summary request fails. */
  fallbackName?: string;
  fallbackPhotoUrl?: string | null;
}

const visuallyHiddenTitleStyle: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

function customerInitials(name?: string | null): string {
  if (!name?.trim()) return "C";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Star;
  label: string;
  value: string;
}) {
  return (
    <Box
      p="3"
      style={{
        backgroundColor: "var(--gray-2)",
        borderRadius: "var(--radius-3)",
        border: "1px solid var(--gray-4)",
        minWidth: 0,
      }}
    >
      <Flex align="center" gap="2" mb="2">
        <Box style={{ color: "var(--gray-9)", display: "flex" }}>
          <Icon size={14} aria-hidden />
        </Box>
        <Text size="1" color="gray" weight="medium">
          {label}
        </Text>
      </Flex>
      <Text size="4" weight="bold" highContrast>
        {value}
      </Text>
    </Box>
  );
}

function RatingBlock({
  averageRating,
  reviewCount,
  noReviewsLabel,
  ratingLine,
  centered = false,
}: {
  averageRating: number | null;
  reviewCount: number;
  noReviewsLabel: string;
  ratingLine: (rating: string, count: number) => string;
  centered?: boolean;
}) {
  const hasRating =
    typeof averageRating === "number" &&
    averageRating > 0 &&
    typeof reviewCount === "number" &&
    reviewCount > 0;

  if (!hasRating) {
    return (
      <Text size="2" color="gray" align={centered ? "center" : "left"}>
        {noReviewsLabel}
      </Text>
    );
  }

  const rating = (averageRating ?? 0).toFixed(2);
  return (
    <Flex
      align="center"
      justify={centered ? "center" : "start"}
      gap="2"
      role="group"
      aria-label={ratingLine(rating, reviewCount)}
    >
      <Star size={18} fill="var(--amber-9)" color="var(--amber-9)" aria-hidden />
      <Text size="3" weight="medium" highContrast>
        {ratingLine(rating, reviewCount)}
      </Text>
    </Flex>
  );
}

function ProfileHero({
  displayName,
  photoUrl,
  profileComplete,
  averageRating,
  reviewCount,
  labels,
}: {
  displayName: string;
  photoUrl?: string;
  profileComplete?: boolean;
  averageRating?: number | null;
  reviewCount?: number;
  labels: ReturnType<typeof useCustomerPreviewLabels>;
}) {
  return (
    <Box
      px="4"
      py="5"
      style={{
        background: "linear-gradient(180deg, var(--gray-2) 0%, var(--color-panel) 100%)",
        borderRadius: "var(--radius-4)",
        border: "1px solid var(--gray-4)",
      }}
    >
      <Flex direction="column" align="center" gap="3">
        <Avatar
          size="7"
          src={photoUrl}
          fallback={customerInitials(displayName)}
          radius="full"
        />
        <Flex direction="column" align="center" gap="2" style={{ width: "100%" }}>
          <Heading as="h2" size="5" align="center" trim="both">
            {displayName}
          </Heading>
          {typeof profileComplete === "boolean" && (
            <Badge color={profileComplete ? "green" : "gray"} variant="soft" size="1" radius="full">
              <Flex align="center" gap="1">
                {profileComplete && <CheckCircle2 size={12} aria-hidden />}
                {profileComplete ? labels.profileComplete : labels.profileIncomplete}
              </Flex>
            </Badge>
          )}
          {typeof averageRating !== "undefined" && typeof reviewCount !== "undefined" && (
            <RatingBlock
              averageRating={averageRating}
              reviewCount={reviewCount}
              noReviewsLabel={labels.noReviews}
              ratingLine={labels.ratingLine}
              centered
            />
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

function LoadingSkeleton() {
  return (
    <Flex direction="column" gap="4">
      <Box
        px="4"
        py="5"
        style={{
          backgroundColor: "var(--gray-2)",
          borderRadius: "var(--radius-4)",
        }}
      >
        <Flex direction="column" align="center" gap="3">
          <Skeleton width="72px" height="72px" style={{ borderRadius: "50%" }} />
          <Skeleton width="160px" height="24px" />
          <Skeleton width="120px" height="20px" />
        </Flex>
      </Box>
      <Grid columns="2" gap="3">
        <Skeleton height="72px" />
        <Skeleton height="72px" />
        <Skeleton height="72px" style={{ gridColumn: "1 / -1" }} />
      </Grid>
    </Flex>
  );
}

export function CustomerPreviewDialog({
  customerId,
  open,
  onOpenChange,
  fallbackName,
  fallbackPhotoUrl,
}: CustomerPreviewDialogProps) {
  const labels = useCustomerPreviewLabels();
  const { data, isPending, isError } = useCustomerPublicSummary(customerId, open);

  const displayName = data?.displayName ?? fallbackName ?? labels.unknownName;
  const photoUrl = data?.photoUrl ?? fallbackPhotoUrl ?? undefined;
  const memberSinceFormatted =
    data?.memberSince &&
    new Date(data.memberSince).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <RadixDialog.Title style={visuallyHiddenTitleStyle}>
          {displayName}
        </RadixDialog.Title>

        {isPending && !data ? (
          <LoadingSkeleton />
        ) : isError || !data ? (
          <Flex direction="column" gap="4">
            <ProfileHero displayName={displayName} photoUrl={photoUrl} labels={labels} />
            <Text size="2" color="gray" align="center">
              {labels.loadFailed}
            </Text>
          </Flex>
        ) : (
          <Flex direction="column" gap="4">
            <ProfileHero
              displayName={data.displayName}
              photoUrl={data.photoUrl ?? undefined}
              profileComplete={data.profileComplete}
              averageRating={data.averageRating}
              reviewCount={data.reviewCount}
              labels={labels}
            />

            <Box>
              <Text size="1" color="gray" weight="medium" mb="3">
                {labels.statsHeading}
              </Text>
              <Grid columns="2" gap="3">
                <StatTile
                  icon={ClipboardList}
                  label={labels.completedBookings}
                  value={String(data.completedBookingsCount)}
                />
                <StatTile
                  icon={Briefcase}
                  label={labels.jobPosts}
                  value={String(data.jobPostingsCount)}
                />
                {memberSinceFormatted && (
                  <Box style={{ gridColumn: "1 / -1" }}>
                    <StatTile
                      icon={CalendarDays}
                      label={labels.memberSince}
                      value={memberSinceFormatted}
                    />
                  </Box>
                )}
              </Grid>
            </Box>
          </Flex>
        )}
      </DialogContent>
    </Dialog>
  );
}
