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
import { useDisputeLabels } from "@/lib/i18n/use-dashboard-labels";
import { useDisputeCategoryLabel, useDisputeStatusLabel } from "@/lib/i18n/dispute-labels";
import { useDateFnsLocale } from "@/lib/i18n/date-fns-locale";

const WITHDRAWABLE_STATUSES = new Set(["open", "in-review"]);

interface DisputeDetailPageClientProps {
  disputeId: string;
}

export default function DisputeDetailPageClient({
  disputeId,
}: DisputeDetailPageClientProps) {
  const labels = useDisputeLabels();
  const d = labels.detail;
  const formatCategory = useDisputeCategoryLabel();
  const disputeStatusLabel = useDisputeStatusLabel();
  const dateLocale = useDateFnsLocale();
  const { data: dispute, isLoading, isError, error } = useDispute(disputeId);
  const user = useUser();
  const withdrawMutation = useWithdrawDispute(disputeId);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const isFiler = !!(dispute && user?.id && dispute.filerId === user.id);
  const canWithdraw =
    isFiler && dispute && WITHDRAWABLE_STATUSES.has(dispute.status);
  const isWithdrawn = dispute?.status === "withdrawn";

  const reportedDate = dispute
    ? format(new Date(dispute.createdAt), "PPp", { locale: dateLocale })
    : "";

  return (
    <Container size="3" px={{ initial: "4", sm: "6" }}>
      <Flex direction="column" gap="6">
        <Box>
          <Button variant="ghost" color="gray" size="2" asChild>
            <Link href="/dashboard/disputes">
              <ArrowLeft size={16} aria-hidden="true" />
              {d.backToReports}
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
              aria-label={d.loadingAria}
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
              {error instanceof Error ? error.message : d.loadFailed}
            </Callout.Text>
          </Callout.Root>
        )}

        {!isLoading && !isError && !dispute && (
          <Card size="3" variant="surface">
            <Flex direction="column" align="center" gap="3" py="6" px="3">
              <Heading size="4" align="center" mb="1" trim="start">
                {d.notFoundTitle}
              </Heading>
              <Text size="2" color="gray" highContrast align="center" as="p">
                {d.notFoundDescription}
              </Text>
              <Button size="2" variant="soft" color="gray" asChild>
                <Link href="/dashboard/disputes">{d.viewAllReports}</Link>
              </Button>
            </Flex>
          </Card>
        )}

        {dispute && (
          <Flex direction="column" gap="5">
            <Card size="4" variant="surface">
              <Flex direction="column" gap="4">
                <Flex justify="between" align="start" gap="3" wrap="wrap">
                  <Box flexGrow="1" style={{ minWidth: 0 }}>
                    <Heading as="h1" size="6" mb="2" trim="start">
                      {dispute.subject}
                    </Heading>
                    <Flex align="center" gap="2" wrap="wrap" aria-live="polite">
                      <DisputeStatusBadge
                        status={dispute.status}
                        label={disputeStatusLabel(dispute.status)}
                      />
                      <Text size="2" color="gray" highContrast>
                        {formatCategory(dispute.category)} &middot;{" "}
                        {d.reportedAt(reportedDate)}
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
                      {d.withdrawReport}
                    </Button>
                  ) : null}
                </Flex>
                {isWithdrawn ? (
                  <Callout.Root color={SEMANTIC_COLOR.neutral} variant="surface">
                    <Callout.Text>{d.withdrawnCallout}</Callout.Text>
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
                    {d.whatHappened}
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
                      {d.noDescription}
                    </Text>
                  )}
                </Box>
                {dispute.evidence && dispute.evidence.length > 0 && (
                  <>
                    <Separator />
                    <Box>
                      <Heading as="h2" size="4" mb="2" trim="start">
                        {d.evidence}
                      </Heading>
                      <Text size="2" color="gray" highContrast as="p">
                        {d.evidenceCount(dispute.evidence.length)}
                      </Text>
                    </Box>
                  </>
                )}
              </Flex>
            </Card>

            <Card size="3" variant="surface">
              <Flex direction="column" gap="3">
                <Heading as="h2" size="5" mb="0" trim="start">
                  {d.whatHappensNext}
                </Heading>
                <Text size="2" color="gray" highContrast as="p">
                  {d.whatHappensNextDescription}
                </Text>
                <Flex gap="2" wrap="wrap" mt="2">
                  <Button size="2" variant="soft" color="gray" asChild>
                    <Link href={`/dashboard/messages/${dispute.bookingId}`}>
                      {d.messageAboutBooking}
                    </Link>
                  </Button>
                  <Button size="2" variant="ghost" color="gray" asChild>
                    <Link href={`/dashboard/bookings/${dispute.bookingId}`}>
                      {d.openTheBooking}
                    </Link>
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        )}

        <ActionConfirmDialog
          open={withdrawConfirmOpen}
          onOpenChange={(open) => {
            if (!open && !withdrawMutation.isPending) {
              setWithdrawConfirmOpen(false);
            }
          }}
          title={d.withdrawConfirmTitle}
          description={d.withdrawConfirmDescription}
          confirmLabel={d.withdrawConfirmLabel}
          cancelLabel={d.withdrawCancelLabel}
          variant="danger"
          pending={withdrawMutation.isPending}
          onConfirm={() => {
            setWithdrawError(null);
            withdrawMutation.mutate(undefined, {
              onSuccess: () => {
                setWithdrawConfirmOpen(false);
              },
              onError: (err) => {
                let message = d.withdrawFailed;
                if (err instanceof Error && err.message) {
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
