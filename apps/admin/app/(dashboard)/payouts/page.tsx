import {
  Badge,
  Card,
  Flex,
  Table,
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRow,
  Text,
} from "@welpco/ui";
import Link from "next/link";
import { AdminErrorCallout, AdminWarningCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { formatAdminDateTime, formatAdminMoneyCents, formatAdminStatusLabel, shortId } from "@/lib/admin-format";
import {
  getPayoutUpcoming,
  listPayoutTaxFailures,
  listPaymentRecoveries,
  listPayoutBatches,
} from "@/lib/services/admin-payouts-service";
import {
  PayoutBuildAction,
  PayoutFeeRefreshAction,
  PayoutRecoveryRefreshAction,
  PayoutTaxRetryAction,
} from "./payout-batch-actions";
import { PayoutWelpersTable } from "./payout-welpers-table";

export const dynamic = "force-dynamic";

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={{ padding: "1rem", minWidth: 160 }}>
      <Text size="1" color="gray" style={{ display: "block", marginBottom: 4 }}>
        {label}
      </Text>
      <Text size="4" weight="medium">
        {value}
      </Text>
    </Card>
  );
}

export default async function PayoutsPage() {
  let upcoming;
  let batches: Awaited<ReturnType<typeof listPayoutBatches>>["data"] = [];
  let recoveries: Awaited<ReturnType<typeof listPaymentRecoveries>>["data"] = [];
  let taxFailures: Awaited<ReturnType<typeof listPayoutTaxFailures>>["data"] = [];
  let err: string | null = null;

  try {
    const [upcomingResult, list, recoveryList, taxFailureList] = await Promise.all([
      getPayoutUpcoming(),
      listPayoutBatches({ limit: 12 }),
      listPaymentRecoveries(),
      listPayoutTaxFailures({ limit: 25 }),
    ]);
    upcoming = upcomingResult;
    batches = list.data;
    recoveries = recoveryList.data;
    taxFailures = taxFailureList.data;
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load payouts";
    upcoming = {
      payoutFriday: "—",
      eligiblePendingCount: 0,
      eligibleWelperCount: 0,
      eligibleWelperNetCents: 0,
      existingBatchId: null,
      existingBatchStatus: null,
      welpers: [],
    };
  }

  const blockedWelpers = upcoming.welpers.filter(
    (welper) => welper.welperNetCents > 0 && !welper.connectReady,
  ).length;

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Payouts"
        description="Review Friday welper payout batches. Build a batch from eligible ledger lines (7-day hold), verify Connect readiness, then approve Stripe transfers."
      />

      {err ? <AdminErrorCallout message={err} /> : null}
      {blockedWelpers > 0 ? (
        <AdminWarningCallout
          message={`${blockedWelpers} eligible welper${blockedWelpers === 1 ? "" : "s"} cannot be paid until Stripe Connect setup is complete.`}
        />
      ) : null}

      <Flex gap="2" wrap="wrap" align="start">
        <PayoutFeeRefreshAction />
        <PayoutTaxRetryAction />
      </Flex>

      {recoveries.length > 0 ? (
        <Card style={{ padding: "1.25rem" }}>
          <Flex direction="column" gap="3">
            <div>
              <Text size="3" weight="medium">
                Transfer recoveries
              </Text>
              <Text size="2" color="gray" style={{ display: "block" }}>
                Reverse the exact outstanding amount in Stripe. Welpco closes the dispute after the webhook confirms it.
              </Text>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableColumnHeaderCell>Booking</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Transfer</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Required</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Recovered</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Outstanding</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Opened</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Refresh</TableColumnHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recoveries.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell>
                      <Link href={`/bookings/${task.bookingId}`}>{shortId(task.bookingId)}</Link>
                    </TableCell>
                    <TableCell>
                      <Link href={task.stripeDashboardUrl} target="_blank" rel="noopener noreferrer">
                        Reverse {shortId(task.stripeTransferId)}
                      </Link>
                    </TableCell>
                    <TableCell>{formatAdminMoneyCents(task.requiredReversalCents, "CAD")}</TableCell>
                    <TableCell>{formatAdminMoneyCents(task.recoveredCents, "CAD")}</TableCell>
                    <TableCell>
                      <Text weight="bold">{formatAdminMoneyCents(task.outstandingCents, "CAD")}</Text>
                    </TableCell>
                    <TableCell>{formatAdminDateTime(task.createdAt)}</TableCell>
                    <TableCell>
                      <PayoutRecoveryRefreshAction stripeTransferId={task.stripeTransferId} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Flex>
        </Card>
      ) : null}

      {taxFailures.length > 0 ? (
        <Card style={{ padding: "1.25rem" }}>
          <Flex direction="column" gap="3">
            <div>
              <Text size="3" weight="medium">
                Stripe Tax failures
              </Text>
              <Text size="2" color="gray" style={{ display: "block" }}>
                Payout ledger rows remain blocked while Stripe Tax transactions or refund reversals are failed.
              </Text>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableColumnHeaderCell>Type</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Booking</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Stripe ID</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Status</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Error</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Updated</TableColumnHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {taxFailures.map((failure) => (
                  <TableRow key={`${failure.kind}:${failure.id}`}>
                    <TableCell>{failure.kind === "transaction" ? "Tax transaction" : "Refund reversal"}</TableCell>
                    <TableCell>
                      <Link href={`/bookings/${failure.bookingId}`}>{shortId(failure.bookingId)}</Link>
                    </TableCell>
                    <TableCell>
                      <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                        {failure.stripeTaxReversalId ??
                          failure.stripeTaxTransactionId ??
                          failure.stripeTaxCalculationId ??
                          failure.refundId ??
                          "—"}
                      </Text>
                    </TableCell>
                    <TableCell>{formatAdminStatusLabel(failure.status ?? "unknown")}</TableCell>
                    <TableCell>
                      <Text size="1" color="red">
                        {failure.error ?? "No error details"}
                      </Text>
                    </TableCell>
                    <TableCell>{formatAdminDateTime(failure.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Flex>
        </Card>
      ) : null}

      <Card style={{ padding: "1.25rem" }}>
        <Flex direction="column" gap="3">
          <Flex justify="between" align="center" wrap="wrap" gap="2">
            <div>
              <Text size="2" color="gray">
                Upcoming payout Friday (Toronto)
              </Text>
              <Text size="5" weight="medium" style={{ display: "block" }}>
                {upcoming.payoutFriday}
              </Text>
            </div>
            <PayoutBuildAction
              payoutFriday={upcoming.payoutFriday}
              existingBatchId={upcoming.existingBatchId}
              existingBatchStatus={upcoming.existingBatchStatus}
            />
          </Flex>

          <Flex gap="3" wrap="wrap">
            <SummaryCard label="Eligible bookings" value={String(upcoming.eligiblePendingCount)} />
            <SummaryCard label="Eligible welpers" value={String(upcoming.eligibleWelperCount)} />
            <SummaryCard
              label="Welper net to transfer"
              value={formatAdminMoneyCents(upcoming.eligibleWelperNetCents, "CAD")}
            />
            <SummaryCard label="Connect blocked" value={String(blockedWelpers)} />
          </Flex>
        </Flex>
      </Card>

      <PayoutWelpersTable
        welpers={upcoming.welpers}
        batchId={upcoming.existingBatchStatus === "review" ? upcoming.existingBatchId : null}
        title={
          upcoming.existingBatchStatus === "review"
            ? "Welpers in current batch (review)"
            : "Eligible welpers (upcoming Friday)"
        }
        emptyMessage={
          upcoming.existingBatchStatus === "review"
            ? "No welpers in this batch."
            : "No eligible payout lines yet. Ensure bookings are payment_released and past the 7-day hold."
        }
      />

      <Card style={{ padding: "1.25rem" }}>
        <Text size="3" weight="medium" style={{ display: "block", marginBottom: "0.75rem" }}>
          Recent batches
        </Text>
        {batches.length === 0 ? (
          <Text color="gray">No payout batches yet.</Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableColumnHeaderCell>Payout Friday</TableColumnHeaderCell>
                <TableColumnHeaderCell>Status</TableColumnHeaderCell>
                <TableColumnHeaderCell>Bookings</TableColumnHeaderCell>
                <TableColumnHeaderCell>Welpers</TableColumnHeaderCell>
                <TableColumnHeaderCell>Welper net</TableColumnHeaderCell>
                <TableColumnHeaderCell>Platform net</TableColumnHeaderCell>
                <TableColumnHeaderCell />
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.payoutFriday}</TableCell>
                  <TableCell>
                    <Badge
                      color={
                        b.status === "completed"
                          ? "green"
                          : b.status === "failed"
                            ? "red"
                            : b.status === "partial"
                              ? "orange"
                              : "gray"
                      }
                    >
                      {formatAdminStatusLabel(b.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{b.bookingCount}</TableCell>
                  <TableCell>{b.welperCount}</TableCell>
                  <TableCell>{formatAdminMoneyCents(b.totalWelperNetCents, "CAD")}</TableCell>
                  <TableCell>{formatAdminMoneyCents(b.totalPlatformNetCents, "CAD")}</TableCell>
                  <TableCell>
                    <Link href={`/payouts/${b.id}`}>Review {shortId(b.id)}</Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </Flex>
  );
}
