"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  ApplicationList,
  JobApplicationForm,
  JobStatusBadge,
} from "@welpco/ui/platform";
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

interface JobDetailPageClientProps {
  jobId: string;
}

export default function JobDetailPageClient({ jobId }: JobDetailPageClientProps) {
  const router = useRouter();
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
    return (
      <Container size="3" py="6">
        <Text>Loading…</Text>
      </Container>
    );
  }

  if (isError || !job) {
    return (
      <Container size="3" py="6">
        <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface">
          <Callout.Text>Job not found.</Callout.Text>
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

  return (
    <Container size="3" py="6">
      <Flex direction="column" gap="5">
        <Flex justify="between" align="start" gap="3" wrap="wrap">
          <Box>
            <Flex align="center" gap="2" mb="2">
              <Heading size="6">{job.title}</Heading>
              <JobStatusBadge status={job.status as import("@welpco/ui/platform").JobStatus} />
            </Flex>
            <Text size="2" color="gray" highContrast>
              {[
                job.subcategoryLabel ?? job.categoryLabel,
                job.locationCity && job.locationRegion
                  ? `${job.locationCity}, ${job.locationRegion}`
                  : job.locationCity ?? job.locationRegion,
                `${job.scheduledDate} · ${job.scheduledStartTime}–${job.scheduledEndTime}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </Text>
          </Box>
          <Button variant="soft" onClick={() => router.push("/dashboard/marketplace")}>
            Back to marketplace
          </Button>
        </Flex>

        <Box>
          <Text size="3">{job.description}</Text>
        </Box>

        {isCustomer && job.locationAddress && (
          <Callout.Root color="gray" variant="surface">
            <Callout.Text>Service address: {job.locationAddress}</Callout.Text>
          </Callout.Root>
        )}

        {canCancel && (
          <Button
            variant="soft"
            color={SEMANTIC_COLOR.danger}
            disabled={cancelMutation.isPending}
            onClick={() => cancelMutation.mutate(jobId)}
          >
            Cancel job
          </Button>
        )}

        {isWelper && (
          <>
            {isJobOpenForWelperApplications(job.status) && !job.myApplicationId && (
              <Button color={SEMANTIC_COLOR.primary} onClick={handleApplyClick}>
                Apply to this job
              </Button>
            )}
            {myApplication && (
              <Callout.Root color="blue" variant="surface">
                <Callout.Text>
                  {`Application status: ${myApplication.status}`}
                </Callout.Text>
                {myApplication.status === "pending" && (
                  <Button
                    variant="soft"
                    mt="2"
                    disabled={withdrawMutation.isPending}
                    onClick={() => withdrawMutation.mutate(myApplication.id)}
                  >
                    Withdraw application
                  </Button>
                )}
              </Callout.Root>
            )}
          </>
        )}

        {isCustomer && (
          <Box>
            <Heading size="5" mb="3">
              Applications ({applications.length})
            </Heading>
            {applications.length === 0 ? (
              <Text size="2" color="gray">No applications yet.</Text>
            ) : (
              <ApplicationList
                items={applications.map((app) => ({
                  candidateName: app.welperDisplayName ?? "Welper",
                  role: job.subcategoryLabel ?? "Service",
                  hourlyRate:
                    app.hourlyRateSnapshot != null
                      ? `$${app.hourlyRateSnapshot}/hr`
                      : "—",
                  submittedAt: new Date(app.createdAt).toLocaleDateString(),
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
                View linked booking
              </Button>
            )}
          </Box>
        )}
      </Flex>

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <Box style={{ maxWidth: 640, maxHeight: "70vh", overflowY: "auto" }}>
          {applyStep === "review" ? (
            <Flex direction="column" gap="4">
              <Box>
                <Heading size="6" mb="1">
                  Review job
                </Heading>
                <Text size="2" color="gray" highContrast>
                  Confirm the job details and customer answers before submitting your application.
                </Text>
              </Box>
              <JobPostingReviewSummary
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
              <Flex justify="end" gap="3">
                <Button variant="soft" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button color={SEMANTIC_COLOR.primary} onClick={() => setApplyStep("submit")}>
                  Continue to application
                </Button>
              </Flex>
            </Flex>
          ) : (
            <Flex direction="column" gap="4">
              <Button variant="soft" onClick={() => setApplyStep("review")}>
                Back to review
              </Button>
              <JobApplicationForm
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
                          : "Failed to apply.",
                    );
                  }
                }}
              />
            </Flex>
          )}
          </Box>
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
