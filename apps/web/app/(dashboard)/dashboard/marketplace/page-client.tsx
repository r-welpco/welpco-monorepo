"use client";

import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { JobCard, JobCardSkeleton, type JobCardLayout } from "@welpco/ui/platform";
import { ApplyBlockedDialog } from "@/components/features/marketplace/apply-blocked-dialog";
import { MarketplaceViewToggle } from "@/components/features/marketplace/marketplace-view-toggle";
import { MarketplaceFilters } from "@/components/features/marketplace/marketplace-filters";
import { useAuthStore } from "@/stores/authStore";
import { useBrowseJobPostings, useMyJobPostings } from "@/lib/hooks/use-job-posting";
import { useState } from "react";
import type { JobApplyBlockReason, JobPostingListItem } from "@/lib/services/job-posting.service";
import { isJobOpenForWelperApplications } from "@/lib/marketplace/apply-block-messages";
import { useMarketplaceLabels } from "@/lib/i18n/use-dashboard-labels";
import { PlusIcon, SearchIcon, FileTextIcon } from "lucide-react";

function formatLocation(city?: string | null, region?: string | null): string | undefined {
  if (city && region) return `${city}, ${region}`;
  return city ?? region ?? undefined;
}

function formatScheduleDate(value: string | null | undefined, locale: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeRange(start?: string | null, end?: string | null): string | undefined {
  if (start && end) return `${start}–${end}`;
  return start ?? end ?? undefined;
}

export default function MarketplacePageClient() {
  const router = useRouter();
  const locale = useLocale();
  const labels = useMarketplaceLabels();
  const { user } = useAuthStore();
  const isCustomer = user?.role === "customer";
  const isWelper = user?.role === "welper";

  const [categoryId, setCategoryId] = useState<string>("");
  const [subcategoryId, setSubcategoryId] = useState<string>("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [viewMode, setViewMode] = useState<JobCardLayout>("grid");
  const [applyBlockedReason, setApplyBlockedReason] = useState<JobApplyBlockReason | null>(null);

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    setSubcategoryId("");
  };

  const clearFilters = () => {
    setCategoryId("");
    setSubcategoryId("");
    setEligibleOnly(false);
  };

  const customerQuery = useMyJobPostings(
    { page: 1, limit: 20 },
    { enabled: isCustomer },
  );
  const welperQuery = useBrowseJobPostings(
    {
      categoryId: categoryId || undefined,
      subcategoryId: subcategoryId || undefined,
      ...(eligibleOnly ? { eligibleOnly: true } : {}),
      page: 1,
      limit: 20,
    },
    { enabled: isWelper },
  );

  const jobs = isCustomer ? customerQuery.data?.data ?? [] : welperQuery.data?.data ?? [];
  const totalCount = isCustomer ? customerQuery.data?.total : welperQuery.data?.total;
  const isLoading = isCustomer ? customerQuery.isLoading : welperQuery.isLoading;
  const isError = isCustomer ? customerQuery.isError : welperQuery.isError;
  const hasFilters = isWelper && (Boolean(categoryId) || Boolean(subcategoryId) || eligibleOnly);

  const handleWelperApply = (job: JobPostingListItem) => {
    if (job.canApply) {
      router.push(`/dashboard/marketplace/${job.id}?apply=1`);
      return;
    }
    if (job.applyBlockReason) {
      setApplyBlockedReason(job.applyBlockReason);
      return;
    }
    router.push(`/dashboard/marketplace/${job.id}`);
  };

  const renderJobCard = (job: JobPostingListItem) => (
    <JobCard
      key={job.id}
      layout={viewMode}
      title={job.title}
      category={job.subcategoryLabel ?? job.categoryLabel ?? labels.card.defaultCategory}
      scheduledDate={formatScheduleDate(job.scheduledDate, locale)}
      scheduledTime={formatTimeRange(job.scheduledStartTime, job.scheduledEndTime)}
      location={formatLocation(job.locationCity, job.locationRegion)}
      createdAt={
        job.publishedAt
          ? new Date(job.publishedAt).toLocaleDateString(locale)
          : undefined
      }
      status={job.status as import("@welpco/ui/platform").JobStatus}
      labels={{
        viewDetails: labels.card.viewDetails,
        apply: labels.card.apply,
        applied: labels.card.applied,
        noApplicationsYet: labels.card.noApplicationsYet,
        applicationCount: labels.card.applicationCount,
        posted: labels.card.posted,
      }}
      customerName={isWelper ? job.customerDisplayName : undefined}
      customerPhotoUrl={isWelper ? job.customerPhotoUrl : undefined}
      applicationCount={isCustomer ? job.applicationCount : undefined}
      applied={isWelper ? Boolean(job.myApplicationId) : undefined}
      onView={() => router.push(`/dashboard/marketplace/${job.id}`)}
      onApply={
        isWelper && isJobOpenForWelperApplications(job.status) && !job.myApplicationId
          ? () => handleWelperApply(job)
          : undefined
      }
    />
  );

  const showToggle = !isLoading && !isError && jobs.length > 0;

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="5">
        <Flex justify="between" align="start" gap="4" wrap="wrap">
          <Box style={{ maxWidth: "640px" }}>
            <Heading size="7" mb="1">
              {isCustomer ? labels.list.titleCustomer : labels.list.titleWelper}
            </Heading>
            <Text size="3" color="gray">
              {isCustomer ? labels.list.subtitleCustomer : labels.list.subtitleWelper}
            </Text>
          </Box>
          {isCustomer && (
            <Button
              color={SEMANTIC_COLOR.primary}
              size="3"
              onClick={() => router.push("/dashboard/marketplace/new")}
            >
              <PlusIcon size={16} aria-hidden />
              {labels.list.postJob}
            </Button>
          )}
        </Flex>

        {isWelper && (
          <MarketplaceFilters
            categoryId={categoryId}
            subcategoryId={subcategoryId}
            eligibleOnly={eligibleOnly}
            onCategoryChange={handleCategoryChange}
            onSubcategoryChange={setSubcategoryId}
            onEligibleChange={setEligibleOnly}
            onClearAll={clearFilters}
            resultCount={isLoading ? undefined : totalCount}
            trailing={
              showToggle ? (
                <MarketplaceViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
              ) : undefined
            }
          />
        )}

        {isCustomer && (
          <Flex justify="between" align="center" gap="3" wrap="wrap">
            <Text size="2" color="gray">
              {isLoading || typeof totalCount !== "number"
                ? ""
                : labels.list.jobPostCount(totalCount)}
            </Text>
            {showToggle && (
              <MarketplaceViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            )}
          </Flex>
        )}

        {isError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>
              {customerQuery.error instanceof Error
                ? customerQuery.error.message
                : welperQuery.error instanceof Error
                  ? welperQuery.error.message
                  : labels.list.loadFailed}
            </Callout.Text>
          </Callout.Root>
        )}

        {isLoading && (
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            {Array.from({ length: 6 }).map((_, i) => (
              <JobCardSkeleton key={i} layout={viewMode} />
            ))}
          </Grid>
        )}

        {!isLoading && !isError && jobs.length === 0 && (
          <EmptyState
            isCustomer={Boolean(isCustomer)}
            hasFilters={Boolean(hasFilters)}
            labels={labels}
            onPostJob={() => router.push("/dashboard/marketplace/new")}
            onClearFilters={clearFilters}
          />
        )}

        {!isLoading && !isError && jobs.length > 0 && (
          viewMode === "grid" ? (
            <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
              {jobs.map(renderJobCard)}
            </Grid>
          ) : (
            <Flex direction="column" gap="3">
              {jobs.map(renderJobCard)}
            </Flex>
          )
        )}
      </Flex>

      <ApplyBlockedDialog
        open={applyBlockedReason != null}
        onOpenChange={(open) => {
          if (!open) setApplyBlockedReason(null);
        }}
        reason={applyBlockedReason}
      />
    </Container>
  );
}

function EmptyState({
  isCustomer,
  hasFilters,
  labels,
  onPostJob,
  onClearFilters,
}: {
  isCustomer: boolean;
  hasFilters: boolean;
  labels: ReturnType<typeof useMarketplaceLabels>;
  onPostJob: () => void;
  onClearFilters: () => void;
}) {
  const Icon = isCustomer ? FileTextIcon : SearchIcon;
  const title = isCustomer
    ? labels.list.empty.customerTitle
    : hasFilters
      ? labels.list.empty.welperFilteredTitle
      : labels.list.empty.welperNoFiltersTitle;
  const description = isCustomer
    ? labels.list.empty.customerDescription
    : hasFilters
      ? labels.list.empty.welperFilteredDescription
      : labels.list.empty.welperNoFiltersDescription;

  return (
    <Flex
      direction="column"
      align="center"
      gap="4"
      py="8"
      px="4"
      style={{ textAlign: "center" }}
    >
      <Flex
        align="center"
        justify="center"
        style={{
          width: "64px",
          height: "64px",
          borderRadius: "9999px",
          backgroundColor: "var(--gray-3)",
          color: "var(--gray-9)",
        }}
      >
        <Icon size={28} aria-hidden />
      </Flex>
      <Box style={{ maxWidth: "420px" }}>
        <Heading size="4" mb="1">
          {title}
        </Heading>
        <Text size="2" color="gray">
          {description}
        </Text>
      </Box>
      {isCustomer && (
        <Button color={SEMANTIC_COLOR.primary} size="3" onClick={onPostJob}>
          <PlusIcon size={16} aria-hidden />
          {labels.list.empty.customerCta}
        </Button>
      )}
      {!isCustomer && hasFilters && (
        <Button variant="soft" color="gray" size="2" onClick={onClearFilters}>
          {labels.list.empty.clearFilters}
        </Button>
      )}
    </Flex>
  );
}
