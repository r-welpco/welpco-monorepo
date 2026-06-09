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
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { formatAdminMoneyCents, formatAdminStatusLabel, shortId } from "@/lib/admin-format";
import { getPayoutUpcoming, listPayoutBatches } from "@/lib/services/admin-payouts-service";
import { PayoutBuildAction, PayoutFeeRefreshAction } from "./payout-batch-actions";
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
  let err: string | null = null;

  try {
    upcoming = await getPayoutUpcoming();
    const list = await listPayoutBatches({ limit: 12 });
    batches = list.data;
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

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Payouts"
        description="Review Friday welper payout batches. Build a batch from eligible ledger lines (7-day hold), verify Connect readiness, then approve Stripe transfers."
      />

      {err ? <AdminErrorCallout message={err} /> : null}

      <PayoutFeeRefreshAction />

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
