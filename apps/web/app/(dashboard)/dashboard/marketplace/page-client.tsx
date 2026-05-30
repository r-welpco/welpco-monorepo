"use client";

import { useRouter } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Grid } from "@welpco/ui/grid";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Switch } from "@welpco/ui/switch";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { JobCard, type JobCardLayout } from "@welpco/ui/platform";
import { ApplyBlockedDialog } from "@/components/features/marketplace/apply-blocked-dialog";
import { MarketplaceViewToggle } from "@/components/features/marketplace/marketplace-view-toggle";
import { useAuthStore } from "@/stores/authStore";
import { useBrowseJobPostings, useMyJobPostings } from "@/lib/hooks/use-job-posting";
import { useState } from "react";
import { useContentCategories } from "@/lib/hooks/use-content";
import type { JobApplyBlockReason, JobPostingListItem } from "@/lib/services/job-posting.service";
import { isJobOpenForWelperApplications } from "@/lib/marketplace/apply-block-messages";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";

function formatLocation(city?: string | null, region?: string | null): string | undefined {
  if (city && region) return `${city}, ${region}`;
  return city ?? region ?? undefined;
}

export default function MarketplacePageClient() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isCustomer = user?.role === "customer";
  const isWelper = user?.role === "welper";

  const [categoryId, setCategoryId] = useState<string>("");
  const [eligibleOnly, setEligibleOnly] = useState(false);
  const [viewMode, setViewMode] = useState<JobCardLayout>("list");
  const [applyBlockedReason, setApplyBlockedReason] = useState<JobApplyBlockReason | null>(null);

  const { data: categories = [] } = useContentCategories(false);
  const parentCategories = categories.filter((c) => c.level === 1);

  const customerQuery = useMyJobPostings(
    { page: 1, limit: 20 },
    { enabled: isCustomer },
  );
  const welperQuery = useBrowseJobPostings(
    {
      categoryId: categoryId || undefined,
      ...(eligibleOnly ? { eligibleOnly: true } : {}),
      page: 1,
      limit: 20,
    },
    { enabled: isWelper },
  );

  const jobs = isCustomer ? customerQuery.data?.data ?? [] : welperQuery.data?.data ?? [];
  const isLoading = isCustomer ? customerQuery.isLoading : welperQuery.isLoading;
  const isError = isCustomer ? customerQuery.isError : welperQuery.isError;

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

  return (
    <Container size="4" py="6">
      <Flex direction="column" gap="5">
        <Flex justify="between" align="start" gap="4" wrap="wrap">
          <Box>
            <Heading size="7" mb="1">
              {isCustomer ? "My job posts" : "Marketplace"}
            </Heading>
            <Text size="3" color="gray" highContrast>
              {isCustomer
                ? "Post jobs when you cannot find a welper through search."
                : "Browse all open jobs. You need a matching service offering to apply."}
            </Text>
          </Box>
          {isCustomer && (
            <Button
              color={SEMANTIC_COLOR.primary}
              onClick={() => router.push("/dashboard/marketplace/new")}
            >
              Post a job
            </Button>
          )}
        </Flex>

        {isWelper && (
          <Flex gap="3" wrap="wrap" align="center" justify="between">
            <Flex gap="3" wrap="wrap" align="center">
              <Box style={{ minWidth: 200 }}>
                <Select
                  value={categoryId || "__all__"}
                  onValueChange={(v) => setCategoryId(v === "__all__" ? "" : v)}
                >
                  <SelectTrigger placeholder="All categories" />
                  <SelectContent>
                    <SelectItem value="__all__">All categories</SelectItem>
                    {parentCategories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Box>
              <Flex align="center" gap="2">
                <Text
                  as="label"
                  size="2"
                  weight="medium"
                  htmlFor="marketplace-eligible-only"
                  style={{ cursor: "pointer" }}
                >
                  Jobs I can apply to
                </Text>
                <Switch
                  id="marketplace-eligible-only"
                  checked={eligibleOnly}
                  onCheckedChange={setEligibleOnly}
                />
              </Flex>
            </Flex>
            {!isLoading && jobs.length > 0 && (
              <MarketplaceViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
            )}
          </Flex>
        )}

        {isCustomer && !isLoading && jobs.length > 0 && (
          <Flex justify="end">
            <MarketplaceViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />
          </Flex>
        )}

        {isError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
            <Callout.Text>
              {customerQuery.error instanceof Error
                ? customerQuery.error.message
                : welperQuery.error instanceof Error
                  ? welperQuery.error.message
                  : "Could not load jobs. Please try again."}
            </Callout.Text>
          </Callout.Root>
        )}

        {isLoading && (
          <Text size="2" color="gray">
            Loading…
          </Text>
        )}

        {!isLoading && jobs.length === 0 && (
          <Callout.Root color="gray" variant="surface">
            <Callout.Text>
              {isCustomer
                ? "You have not posted any jobs yet."
                : "No open jobs match your filters."}
            </Callout.Text>
          </Callout.Root>
        )}

        {viewMode === "grid" ? (
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                layout="grid"
                title={job.title}
                category={job.subcategoryLabel ?? job.categoryLabel ?? "Service"}
                location={formatLocation(job.locationCity, job.locationRegion)}
                createdAt={
                  job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : undefined
                }
                status={job.status as import("@welpco/ui/platform").JobStatus}
                description={`${job.scheduledDate} · ${job.scheduledStartTime}–${job.scheduledEndTime}`}
                customerName={isWelper ? job.customerDisplayName : undefined}
                customerPhotoUrl={isWelper ? job.customerPhotoUrl : undefined}
                tags={
                  isCustomer
                    ? [`${job.applicationCount} application${job.applicationCount === 1 ? "" : "s"}`]
                    : job.myApplicationId
                      ? ["Applied"]
                      : undefined
                }
                onView={() => router.push(`/dashboard/marketplace/${job.id}`)}
                onApply={
                  isWelper &&
                  isJobOpenForWelperApplications(job.status) &&
                  !job.myApplicationId
                    ? () => handleWelperApply(job)
                    : undefined
                }
              />
            ))}
          </Grid>
        ) : (
          <Flex direction="column" gap="3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                layout="list"
                title={job.title}
                category={job.subcategoryLabel ?? job.categoryLabel ?? "Service"}
                location={formatLocation(job.locationCity, job.locationRegion)}
                createdAt={
                  job.publishedAt ? new Date(job.publishedAt).toLocaleDateString() : undefined
                }
                status={job.status as import("@welpco/ui/platform").JobStatus}
                description={`${job.scheduledDate} · ${job.scheduledStartTime}–${job.scheduledEndTime}`}
                customerName={isWelper ? job.customerDisplayName : undefined}
                customerPhotoUrl={isWelper ? job.customerPhotoUrl : undefined}
                tags={
                  isCustomer
                    ? [`${job.applicationCount} application${job.applicationCount === 1 ? "" : "s"}`]
                    : job.myApplicationId
                      ? ["Applied"]
                      : undefined
                }
                onView={() => router.push(`/dashboard/marketplace/${job.id}`)}
                onApply={
                  isWelper &&
                  isJobOpenForWelperApplications(job.status) &&
                  !job.myApplicationId
                    ? () => handleWelperApply(job)
                    : undefined
                }
              />
            ))}
          </Flex>
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
