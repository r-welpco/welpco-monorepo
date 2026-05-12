"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { Skeleton } from "@welpco/ui/skeleton";
import { Callout } from "@welpco/ui/callout";
import { Separator } from "@welpco/ui/separator";
import { DisputeStatusBadge, ActionConfirmDialog } from "@welpco/ui";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useDispute, useWithdrawDispute } from "@/lib/hooks/use-disputes";
import { useUser } from "@/stores/authStore";

/** Wave 2 (BFF): the filer can withdraw only while the report is in one of
 *  these statuses. Once admin escalates or finalises, withdraw is gone. */
const WITHDRAWABLE_STATUSES = new Set(["open", "in-review"]);

const CATEGORY_LABELS: Record<string, string> = {
  no_show: "No-show",
  quality: "Service quality",
  overcharge: "Pricing",
  safety: "Safety",
  other: "Other",
};

function formatCategory(raw: string): string {
  return CATEGORY_LABELS[raw] ?? raw.replace(/_/g, " ");
}

interface DisputeDetailPageClientProps {
  disputeId: string;
}

export default function DisputeDetailPageClient({
  disputeId,
}: DisputeDetailPageClientProps) {
  const { data: dispute, isLoading, isError, error } = useDispute(disputeId);
  const user = useUser();
  const withdrawMutation = useWithdrawDispute(disputeId);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const isFiler = !!(dispute && user?.id && dispute.filerId === user.id);
  const canWithdraw =
    isFiler && dispute && WITHDRAWABLE_STATUSES.has(dispute.status);
  const isWithdrawn = dispute?.status === "withdrawn";

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6">
        <Box>
          <Button variant="ghost" color="gray" size="2" asChild>
            <Link href="/dashboard/disputes">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to reports
            </Link>
          </Button>
        </Box>

        {isLoading && (
          <Card size="3" variant="surface">
            <Flex
              direction="column"
              gap="3"
              aria-busy="true"
              aria-live="polite"
              aria-label="Loading report"
            >
              <Skeleton height="32px" width="60%" />
              <Skeleton height="20px" width="40%" />
              <Skeleton height="120px" />
            </Flex>
          </Card>
        )}

        {isError && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>
              {error instanceof Error
                ? error.message
                : "We couldn't load this report. Try again in a moment."}
            </Callout.Text>
          </Callout.Root>
        )}

        {!isLoading && !isError && !dispute && (
          <Card size="3" variant="surface">
            <Flex direction="column" align="center" gap="3" py="6" px="3">
              <Heading size="4" align="center" mb="1" trim="start">
                Report not found
              </Heading>
              <Text size="2" color="gray" highContrast align="center" as="p">
                This report doesn&apos;t exist, or you don&apos;t have access to it. If this looks wrong, contact support.
              </Text>
              <Button size="2" variant="soft" color="gray" asChild>
                <Link href="/dashboard/disputes">View all reports</Link>
              </Button>
            </Flex>
          </Card>
        )}

        {dispute && (
          <Flex direction="column" gap="5">
            {/* Hero card */}
            <Card size="4" variant="surface">
              <Flex direction="column" gap="4">
                <Flex justify="between" align="start" gap="3" wrap="wrap">
                  <Box flexGrow="1" style={{ minWidth: 0 }}>
                    <Heading
                      as="h1"
                      size="6"
                      mb="2"
                      trim="start"
                    >
                      {dispute.subject}
                    </Heading>
                    <Flex
                      align="center"
                      gap="2"
                      wrap="wrap"
                      aria-live="polite"
                    >
                      <DisputeStatusBadge status={dispute.status} />
                      <Text size="2" color="gray" highContrast>
                        {formatCategory(dispute.category)} &middot; Reported{" "}
                        {format(new Date(dispute.createdAt), "PPp")}
                      </Text>
                    </Flex>
                  </Box>
                  {canWithdraw ? (
                    <Button
                      size="2"
                      variant="outline"
                      color={SEMANTIC_COLOR.danger}
                      onClick={() => {
                        setWithdrawError(null);
                        setWithdrawConfirmOpen(true);
                      }}
                      disabled={withdrawMutation.isPending}
                    >
                      Withdraw report
                    </Button>
                  ) : null}
                </Flex>
                {isWithdrawn ? (
                  <Callout.Root color={SEMANTIC_COLOR.neutral} variant="surface">
                    <Callout.Text>
                      This report has been withdrawn. The booking is back to its previous state. You can file a new report later if something else comes up.
                    </Callout.Text>
                  </Callout.Root>
                ) : null}
                {withdrawError ? (
                  <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
                    <Callout.Text>{withdrawError}</Callout.Text>
                  </Callout.Root>
                ) : null}
                <Separator />
                <Box>
                  <Heading as="h2" size="4" mb="2" trim="start">
                    What happened
                  </Heading>
                  {dispute.description ? (
                    <Text
                      size="2"
                      color="gray"
                      highContrast
                      as="p"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {dispute.description}
                    </Text>
                  ) : (
                    <Text size="2" color="gray" as="p">
                      No description provided.
                    </Text>
                  )}
                </Box>
                {dispute.evidence && dispute.evidence.length > 0 && (
                  <>
                    <Separator />
                    <Box>
                      <Heading as="h2" size="4" mb="2" trim="start">
                        Evidence
                      </Heading>
                      <Text size="2" color="gray" highContrast as="p">
                        {dispute.evidence.length} item
                        {dispute.evidence.length === 1 ? "" : "s"} attached.
                      </Text>
                    </Box>
                  </>
                )}
              </Flex>
            </Card>

            {/* What's next */}
            <Card size="3" variant="surface">
              <Flex direction="column" gap="3">
                <Heading as="h2" size="5" mb="0" trim="start">
                  What happens next
                </Heading>
                <Text size="2" color="gray" highContrast as="p">
                  Our team reviews every report within 48 hours. We may reach out for more detail before deciding. You&apos;ll see updates here and in your inbox.
                </Text>
                <Flex gap="2" wrap="wrap" mt="2">
                  <Button size="2" variant="soft" color="gray" asChild>
                    <Link
                      href={`/dashboard/messages/${dispute.bookingId}`}
                    >
                      Message about the booking
                    </Link>
                  </Button>
                  <Button size="2" variant="ghost" color="gray" asChild>
                    <Link href={`/dashboard/bookings/${dispute.bookingId}`}>
                      Open the booking
                    </Link>
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        )}

        {/* Withdraw report — destructive confirm (bible §17.6 + §22 voice). */}
        <ActionConfirmDialog
          open={withdrawConfirmOpen}
          onOpenChange={(open) => {
            if (!open && !withdrawMutation.isPending) {
              setWithdrawConfirmOpen(false);
            }
          }}
          title="Withdraw your report?"
          description="This closes the report and tells the team you no longer need a resolution. You can file a new report later if needed."
          confirmLabel="Withdraw report"
          cancelLabel="Keep report open"
          variant="danger"
          pending={withdrawMutation.isPending}
          onConfirm={() => {
            setWithdrawError(null);
            withdrawMutation.mutate(undefined, {
              onSuccess: () => {
                setWithdrawConfirmOpen(false);
              },
              onError: (err) => {
                // Bible §17.5 — what / why / what-to-do.
                let message =
                  "We couldn't withdraw this report. Try again in a moment, or contact support if it keeps happening.";
                if (err instanceof Error && err.message) {
                  // The BFF returns 403 (not the filer) and 400 (already
                  // resolved/closed/escalated). Surface the underlying message
                  // so the user sees the actual reason rather than a generic.
                  message = err.message;
                }
                setWithdrawError(message);
                setWithdrawConfirmOpen(false);
              },
            });
          }}
        />
      </Flex>
    </Container>
  );
}
