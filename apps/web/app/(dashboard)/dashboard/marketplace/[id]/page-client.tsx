"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Card } from "@welpco/ui/card";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Badge } from "@welpco/ui/badge";
import { Callout } from "@welpco/ui/callout";
import { Separator } from "@welpco/ui/separator";
import { Skeleton } from "@welpco/ui/skeleton";
import {
  DataList,
  DataListItem,
  DataListLabel,
  DataListValue,
} from "@welpco/ui/data-list";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  ApplicationList,
  JobApplicationForm,
  JobStatusBadge,
} from "@welpco/ui/platform";
import { customerHourlyChargeFromWelperRate } from "@welpco/ui/pricing/welper-customer-rate";
import { JobPostingReviewSummary } from "@/components/features/marketplace/job-posting-review-summary";
import { ApplyBlockedDialog } from "@/components/features/marketplace/apply-blocked-dialog";
import { useAuthStore } from "@/stores/authStore";
import type { JobApplyBlockReason } from "@/lib/services/job-posting.service";
import { isJobOpenForWelperApplications } from "@/lib/marketplace/apply-block-messages";
import {
  useApplyToJob,
  useCancelJobPosting,
  useJobApplications,
  useJobPosting,
  useWithdrawJobApplication,
} from "@/lib/hooks/use-job-posting";
import { ApiClientError } from "@/lib/api/client";
import { useMarketplaceLabels } from "@/lib/i18n/use-dashboard-labels";
import { useCategoryDisplayName } from "@/lib/i18n/category-display-name";
import { ArrowLeft, ArrowRight, Check, MapPin, Users2 } from "lucide-react";

interface JobDetailPageClientProps {
  jobId: string;
}

function formatScheduleDate(value: string | null | undefined, locale: string): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleDateString(locale, { month: "short", day: "numeric" });
}

function ApplyStepper({
  activeIndex,
  steps,
}: {
  activeIndex: number;
  steps: readonly { key: string; label: string }[];
}) {
  const primary = SEMANTIC_COLOR.primary;
  return (
    <Flex align="center" gap="2" aria-hidden>
      {steps.map((step, i) => {
        const isActive = i === activeIndex;
        const isDone = i < activeIndex;
        const accent = isActive || isDone;
        return (
          <Fragment key={step.key}>
            <Flex
              align="center"
              gap="2"
              px="3"
              py="1"
              style={{
                borderRadius: "9999px",
                backgroundColor: accent ? `var(--${primary}-3)` : "var(--gray-3)",
                border: accent
                  ? `1px solid var(--${primary}-6)`
                  : "1px solid var(--gray-5)",
                color: accent ? `var(--${primary}-11)` : "var(--gray-11)",
              }}
            >
              {isDone ? (
                <Check size={14} aria-hidden />
              ) : (
                <Text size="1" weight="bold">
                  {i + 1}
                </Text>
              )}
              <Text size="2" weight={isActive ? "bold" : "medium"}>
                {step.label}
              </Text>
            </Flex>
            {i < steps.length - 1 && (
              <Box
                style={{ flex: 1, height: "1px", backgroundColor: "var(--gray-5)" }}
              />
            )}
          </Fragment>
        );
      })}
    </Flex>
  );
}

const APPLICATION_STATUS_COLORS: Record<
  "pending" | "accepted" | "rejected" | "withdrawn",
  "blue" | "green" | "red" | "gray"
> = {
  pending: "blue",
  accepted: "green",
  rejected: "red",
  withdrawn: "gray",
};

function JobDetailSkeleton() {
  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        <Skeleton width="160px" height="32px" />
        <Card size="4" variant="surface">
          <Flex direction="column" gap="4">
            <Skeleton width="100px" height="20px" />
            <Skeleton width="70%" height="32px" />
            <Separator size="4" />
            <Flex wrap="wrap" gapX="6" gapY="4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} width="140px" height="40px" />
              ))}
            </Flex>
          </Flex>
        </Card>
        <Card size="4" variant="surface">
          <Flex direction="column" gap="3">
            <Skeleton width="140px" height="24px" />
            <Skeleton width="100%" height="16px" />
            <Skeleton width="90%" height="16px" />
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}

export default function JobDetailPageClient({ jobId }: JobDetailPageClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const labels = useMarketplaceLabels();
  const categoryDisplayName = useCategoryDisplayName();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const isCustomer = user?.role === "customer";
  const isWelper = user?.role === "welper";

  const { data: job, isLoading, isError } = useJobPosting(jobId);
  const { data: applications = [] } = useJobApplications(jobId, isCustomer);
  const applyMutation = useApplyToJob(jobId);
  const withdrawMutation = useWithdrawJobApplication(jobId);
  const cancelMutation = useCancelJobPosting();

  const [applyOpen, setApplyOpen] = useState(false);
  const [applyStep, setApplyStep] = useState<"review" | "submit">("review");
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applyBlockedReason, setApplyBlockedReason] = useState<JobApplyBlockReason | null>(null);

  const applySteps = useMemo(
    () => [
      { key: "review", label: labels.detail.applyStepReview },
      { key: "submit", label: labels.detail.applyStepSubmit },
    ],
    [labels.detail.applyStepReview, labels.detail.applyStepSubmit],
  );

  const applicationReviewLabels = useMemo(
    () => ({
      verified: labels.applicationReview.verified,
      applied: labels.applicationReview.applied,
      sendBookingRequest: labels.applicationReview.sendBookingRequest,
      statusLabel: labels.applicationReview.statusLabel,
    }),
    [labels.applicationReview],
  );

  const applicationFormLabels = useMemo(
    () => ({
      title: labels.applicationForm.title,
      subtitle: labels.applicationForm.subtitle,
      serviceOffering: labels.applicationForm.serviceOffering,
      selectOffering: labels.applicationForm.selectOffering,
      selectOfferingError: labels.applicationForm.selectOfferingError,
      yourRate: labels.applicationForm.yourRate,
      proposalMessage: labels.applicationForm.proposalMessage,
      proposalPlaceholder: labels.applicationForm.proposalPlaceholder,
      proposalMinError: labels.applicationForm.proposalMinError,
      submitting: labels.applicationForm.submitting,
      submit: labels.applicationForm.submit,
    }),
    [labels.applicationForm],
  );

  useEffect(() => {
    if (applyOpen) {
      setApplyStep("review");
      setApplyError(null);
    }
  }, [applyOpen]);

  useEffect(() => {
    if (searchParams.get("apply") !== "1" || !job?.canApply) return;
    setApplyOpen(true);
    router.replace(`/dashboard/marketplace/${jobId}`, { scroll: false });
  }, [job?.canApply, jobId, router, searchParams]);

  const myApplication = isWelper
    ? job?.myApplication ?? null
    : applications.find((a) => a.welperId === user?.id);

  const handleSendBookingRequest = (applicationId: string) => {
    router.push(
      `/dashboard/booking/new?jobId=${encodeURIComponent(jobId)}&applicationId=${encodeURIComponent(applicationId)}`,
    );
  };

  const handleApplyClick = () => {
    if (!job) return;
    if (job.applyBlockReason) {
      setApplyBlockedReason(job.applyBlockReason);
      return;
    }
    setApplyOpen(true);
  };

  if (isLoading) {
    return <JobDetailSkeleton />;
  }

  if (isError || !job) {
    return (
      <Container size="3" py="6">
        <Button variant="ghost" color="gray" mb="4" onClick={() => router.push("/dashboard/marketplace")}>
          <ArrowLeft size={16} aria-hidden />
          {labels.detail.back}
        </Button>
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
          <Callout.Text>{labels.detail.notFound}</Callout.Text>
        </Callout.Root>
      </Container>
    );
  }

  const canCancel =
    isCustomer &&
    !job.bookingId &&
    job.status !== "cancelled" &&
    job.status !== "converted_to_booking" &&
    job.status !== "completed";

  const locationLine =
    job.locationCity && job.locationRegion
      ? `${job.locationCity}, ${job.locationRegion}`
      : job.locationCity ?? job.locationRegion ?? null;

  const rawServiceLabel = job.subcategoryLabel ?? job.categoryLabel;
  const serviceLabel = rawServiceLabel ? categoryDisplayName(rawServiceLabel) : null;
  const closesAt = formatDateTime(job.expiresAt, locale);
  const canApplyNow = isWelper && isJobOpenForWelperApplications(job.status) && !job.myApplicationId;
  const appStatus = myApplication
    ? {
        ...labels.detail.applicationStatus(myApplication.status),
        color: APPLICATION_STATUS_COLORS[myApplication.status],
      }
    : null;

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        <Box>
          <Button variant="ghost" color="gray" onClick={() => router.push("/dashboard/marketplace")}>
            <ArrowLeft size={16} aria-hidden />
            {labels.detail.back}
          </Button>
        </Box>

        {/* Hero header */}
        <Card size="4" variant="surface">
          <Flex direction="column" gap="4">
            <Flex justify="between" align="start" gap="3" wrap="wrap">
              <Box style={{ minWidth: 0, flex: 1 }}>
                {serviceLabel && (
                  <Badge color="blue" variant="soft" size="1" radius="full" mb="2">
                    {serviceLabel}
                  </Badge>
                )}
                <Heading size="7" trim="start">
                  {job.title}
                </Heading>
              </Box>
              <Box style={{ flexShrink: 0 }}>
                <JobStatusBadge
                  status={job.status as import("@welpco/ui/platform").JobStatus}
                  label={labels.statusLabel(job.status as import("@welpco/ui/platform").JobStatus)}
                />
              </Box>
            </Flex>

            <Separator size="4" />

            <DataList
              orientation={{ initial: "vertical", xs: "horizontal" }}
              size="2"
            >
              <DataListItem>
                <DataListLabel minWidth="96px">{labels.detail.date}</DataListLabel>
                <DataListValue>{formatScheduleDate(job.scheduledDate, locale)}</DataListValue>
              </DataListItem>
              <DataListItem>
                <DataListLabel minWidth="96px">{labels.detail.time}</DataListLabel>
                <DataListValue>
                  {`${job.scheduledStartTime}–${job.scheduledEndTime}`}
                </DataListValue>
              </DataListItem>
              <DataListItem>
                <DataListLabel minWidth="96px">{labels.detail.duration}</DataListLabel>
                <DataListValue>
                  {job.durationMinutes
                    ? labels.reviewSummary.formatDuration(job.durationMinutes)
                    : "—"}
                </DataListValue>
              </DataListItem>
              {locationLine && (
                <DataListItem>
                  <DataListLabel minWidth="96px">{labels.detail.location}</DataListLabel>
                  <DataListValue>{locationLine}</DataListValue>
                </DataListItem>
              )}
              {isCustomer && (
                <DataListItem>
                  <DataListLabel minWidth="96px">{labels.detail.applications}</DataListLabel>
                  <DataListValue>
                    {String(job.applicationCount ?? applications.length)}
                  </DataListValue>
                </DataListItem>
              )}
              {isWelper && canApplyNow && closesAt && (
                <DataListItem>
                  <DataListLabel minWidth="96px">{labels.detail.closes}</DataListLabel>
                  <DataListValue>{closesAt}</DataListValue>
                </DataListItem>
              )}
            </DataList>

            {(canApplyNow || canCancel) && (
              <>
                <Separator size="4" />
                <Flex justify="end" gap="3" wrap="wrap">
                  {canCancel && (
                    <Button
                      variant="soft"
                      color={SEMANTIC_COLOR.danger}
                      disabled={cancelMutation.isPending}
                      onClick={() => cancelMutation.mutate(jobId)}
                    >
                      {labels.detail.cancelJob}
                    </Button>
                  )}
                  {canApplyNow && (
                    <Button color={SEMANTIC_COLOR.primary} size="3" onClick={handleApplyClick}>
                      {labels.detail.applyToJob}
                    </Button>
                  )}
                </Flex>
              </>
            )}
          </Flex>
        </Card>

        {/* Welper application status */}
        {isWelper && myApplication && appStatus && (
          <Card size="3" variant="surface">
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2" wrap="wrap">
                <Text size="2" weight="bold">
                  {labels.detail.yourApplication}
                </Text>
                <Badge color={appStatus.color} variant="soft" radius="full">
                  {appStatus.label}
                </Badge>
              </Flex>
              <Text size="2" color="gray" highContrast>
                {appStatus.helper}
              </Text>
              {myApplication.status === "pending" && (
                <Flex justify="end">
                  <Button
                    variant="soft"
                    color="gray"
                    disabled={withdrawMutation.isPending}
                    onClick={() => withdrawMutation.mutate(myApplication.id)}
                  >
                    {labels.detail.withdrawApplication}
                  </Button>
                </Flex>
              )}
            </Flex>
          </Card>
        )}

        {/* Description */}
        {job.description && (
          <Card size="4" variant="surface">
            <Flex direction="column" gap="2">
              <Heading size="4" trim="start">
                {labels.detail.aboutJob}
              </Heading>
              <Text size="3" style={{ whiteSpace: "pre-line" }}>
                {job.description}
              </Text>
            </Flex>
          </Card>
        )}

        {isCustomer && job.locationAddress && (
          <Callout.Root color="gray" variant="surface">
            <Callout.Icon>
              <MapPin size={16} aria-hidden />
            </Callout.Icon>
            <Callout.Text>{labels.detail.serviceAddress(job.locationAddress)}</Callout.Text>
          </Callout.Root>
        )}

        {/* Applications (customer) */}
        {isCustomer && (
          <Box>
            <Flex align="center" gap="2" mb="3">
              <Heading size="5" trim="start">
                {labels.detail.applicationsTitle}
              </Heading>
              <Badge color="gray" variant="soft" radius="full" size="2">
                {applications.length}
              </Badge>
            </Flex>
            {applications.length === 0 ? (
              <Card size="3" variant="surface">
                <Flex direction="column" align="center" gap="2" py="5" style={{ textAlign: "center" }}>
                  <Flex
                    align="center"
                    justify="center"
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "9999px",
                      backgroundColor: "var(--gray-3)",
                      color: "var(--gray-9)",
                    }}
                  >
                    <Users2 size={22} aria-hidden />
                  </Flex>
                  <Text size="2" color="gray" highContrast weight="medium">
                    {labels.detail.noApplicationsTitle}
                  </Text>
                  <Text size="2" color="gray">
                    {labels.detail.noApplicationsDescription}
                  </Text>
                </Flex>
              </Card>
            ) : (
              <ApplicationList
                labels={{
                  card: applicationReviewLabels,
                  emptyDescription: labels.applicationReview.emptyDescription,
                  tryAgain: labels.applicationReview.tryAgain,
                }}
                items={applications.map((app) => ({
                  candidateName: app.welperDisplayName ?? labels.detail.welperFallback,
                  role: job.subcategoryLabel
                    ? categoryDisplayName(job.subcategoryLabel)
                    : labels.card.defaultCategory,
                  hourlyRate:
                    app.hourlyRateSnapshot != null
                      ? labels.applicationReview.hourlyRate(
                          customerHourlyChargeFromWelperRate(
                            app.hourlyRateSnapshot,
                          ),
                        )
                      : "—",
                  submittedAt: new Date(app.createdAt).toLocaleDateString(locale),
                  proposalMessage: app.proposalMessage,
                  status: app.status,
                  welperVerified: app.welperVerified,
                  onSendBookingRequest:
                    app.status === "pending" && !job.bookingId
                      ? () => handleSendBookingRequest(app.id)
                      : undefined,
                  sendBookingRequestDisabled:
                    job.status === "converted_to_booking" || !!job.bookingId,
                }))}
              />
            )}
            {job.bookingId && (
              <Button
                variant="soft"
                mt="3"
                onClick={() => router.push(`/dashboard/bookings/${job.bookingId}`)}
              >
                {labels.detail.viewLinkedBooking}
              </Button>
            )}
          </Box>
        )}
      </Flex>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent
          title={labels.detail.applyDialogTitle}
          description={
            applyStep === "review"
              ? labels.detail.applyDialogReviewDescription
              : labels.detail.applyDialogSubmitDescription
          }
        >
          <ApplyStepper activeIndex={applyStep === "review" ? 0 : 1} steps={applySteps} />

          <Box
            pr="2"
            style={{ maxHeight: "56vh", overflowY: "auto" }}
          >
            {applyStep === "review" ? (
              <JobPostingReviewSummary
                embedded
                title={job.title}
                description={job.description}
                categoryLabel={job.categoryLabel}
                subcategoryLabel={job.subcategoryLabel}
                scheduledDate={job.scheduledDate}
                scheduledStartTime={job.scheduledStartTime}
                scheduledEndTime={job.scheduledEndTime}
                durationMinutes={job.durationMinutes}
                locationCity={job.locationCity}
                locationRegion={job.locationRegion}
                answers={job.answers ?? {}}
                serviceQuestionCategoryId={job.serviceQuestionCategoryId}
              />
            ) : (
              <JobApplicationForm
                embedded
                formId="welper-apply-form"
                hideSubmit
                labels={applicationFormLabels}
                matchingOfferings={job.matchingOfferings ?? []}
                loading={applyMutation.isPending}
                error={applyError ?? undefined}
                onSubmit={async (values: { offeringId: string; proposalMessage: string }) => {
                  setApplyError(null);
                  try {
                    await applyMutation.mutateAsync(values);
                    setApplyOpen(false);
                  } catch (e) {
                    setApplyError(
                      e instanceof ApiClientError
                        ? e.message
                        : e instanceof Error
                          ? e.message
                          : labels.detail.applyFailed,
                    );
                  }
                }}
              />
            )}
          </Box>

          <Separator size="4" />

          {applyStep === "review" ? (
            <Flex justify="between" align="center" gap="3">
              <Button variant="soft" color="gray" onClick={() => setApplyOpen(false)}>
                {labels.detail.cancel}
              </Button>
              <Button color={SEMANTIC_COLOR.primary} onClick={() => setApplyStep("submit")}>
                {labels.detail.continueToProposal}
                <ArrowRight size={16} aria-hidden />
              </Button>
            </Flex>
          ) : (
            <Flex justify="between" align="center" gap="3">
              <Button variant="ghost" color="gray" onClick={() => setApplyStep("review")}>
                <ArrowLeft size={16} aria-hidden />
                {labels.new.back}
              </Button>
              <Button
                type="submit"
                form="welper-apply-form"
                color={SEMANTIC_COLOR.primary}
                loading={applyMutation.isPending}
              >
                {labels.detail.submitApplication}
              </Button>
            </Flex>
          )}
        </DialogContent>
      </Dialog>

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
