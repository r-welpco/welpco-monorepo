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
import { notFound } from "next/navigation";
import { AdminErrorCallout, AdminWarningCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { formatAdminDateTime, formatAdminMoneyCents, formatAdminStatusLabel, shortId } from "@/lib/admin-format";
import { getPayoutBatch } from "@/lib/services/admin-payouts-service";
import { PayoutApproveAction } from "../payout-batch-actions";
import { PayoutLineDetailsButton, PayoutWelperDetailsButton } from "../payout-computation-details-modal";
import { PayoutBatchExportClient } from "./payout-batch-export-client";

export const dynamic = "force-dynamic";

export default async function PayoutBatchPage({ params }: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await params;
  let batch;
  let err: string | null = null;

  try {
    batch = await getPayoutBatch(batchId);
  } catch (e) {
    if (e instanceof Error && e.message.toLowerCase().includes("not found")) {
      notFound();
    }
    err = e instanceof Error ? e.message : "Failed to load batch";
    return (
      <Flex direction="column" gap="4">
        <AdminPageHeader title="Payout batch" description={`Batch ${batchId}`} />
        <AdminErrorCallout message={err} />
        <Link href="/payouts">← Back to payouts</Link>
      </Flex>
    );
  }

  const blockedWelpers = batch.welpers.filter((w) => w.welperNetCents > 0 && !w.connectReady).length;

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title={`Payout batch — ${batch.payoutDate}`}
        description="Per-welper rollup and booking drill-down. Platform net = service fee spread minus Stripe processing fees."
      />

      <Link href="/payouts">← Back to payouts</Link>

      {["executing", "partial", "failed"].includes(batch.status) ? (
        <AdminWarningCallout
          message={
            <>
              <Text weight="bold">Verify this batch in Stripe Dashboard before any retry.</Text> Transfers with an ID
              must not be submitted again. Only rows with no transfer ID are eligible for a future batch.
            </>
          }
        />
      ) : null}

      <Card style={{ padding: "1.25rem" }}>
        <Flex justify="between" align="start" wrap="wrap" gap="3">
          <Flex direction="column" gap="1">
            <Text size="2" color="gray">
              Batch {shortId(batch.id)}
            </Text>
            <Badge
              color={
                batch.status === "completed"
                  ? "green"
                  : batch.status === "failed"
                    ? "red"
                    : batch.status === "partial"
                      ? "orange"
                      : "gray"
              }
            >
              {formatAdminStatusLabel(batch.status)}
            </Badge>
            {batch.executedAt ? (
              <Text size="2" color="gray">
                Executed {formatAdminDateTime(batch.executedAt)}
              </Text>
            ) : null}
          </Flex>
          <Flex direction="column" gap="2" align="end">
            <PayoutApproveAction
              batchId={batch.id}
              status={batch.status}
              totalWelperNetCents={batch.totalWelperNetCents}
              welperCount={batch.welperCount}
              blockedWelpers={blockedWelpers}
            />
            <PayoutBatchExportClient batchId={batch.id} />
          </Flex>
        </Flex>

        <Flex gap="3" wrap="wrap" style={{ marginTop: "1rem" }}>
          {[
            ["Customer captured", formatAdminMoneyCents(batch.totalCustomerCapturedCents, "CAD")],
            ["Welper net", formatAdminMoneyCents(batch.totalWelperNetCents, "CAD")],
            ["Platform gross", formatAdminMoneyCents(batch.totalPlatformGrossCents, "CAD")],
            ["Stripe fees", formatAdminMoneyCents(batch.totalStripeFeeCents, "CAD")],
            ["Platform net", formatAdminMoneyCents(batch.totalPlatformNetCents, "CAD")],
          ].map(([label, value]) => (
            <Card key={label} style={{ padding: "0.75rem 1rem", minWidth: 140 }}>
              <Text size="1" color="gray">
                {label}
              </Text>
              <Text weight="medium">{value}</Text>
            </Card>
          ))}
        </Flex>
      </Card>

      {batch.welpers.map((welper) => (
        <Card key={welper.welperId} style={{ padding: "1.25rem" }}>
          <Flex justify="between" align="start" wrap="wrap" gap="2" style={{ marginBottom: "0.75rem" }}>
            <div>
              <Link href={`/users/${welper.welperId}`}>
                <Text weight="medium">{welper.welperEmail ?? welper.welperId}</Text>
              </Link>
              <Text size="2" color="gray">
                {welper.bookingCount} booking
                {welper.bookingCount === 1 ? "" : "s"} · Transfer {formatAdminMoneyCents(welper.welperNetCents, "CAD")}
              </Text>
            </div>
            <Badge color={welper.connectReady ? "green" : "red"}>
              {welper.connectReady ? "Connect ready" : "Connect missing"}
            </Badge>
            <PayoutWelperDetailsButton welper={welper} />
          </Flex>

          <Table>
            <TableHeader>
              <TableRow>
                <TableColumnHeaderCell>Booking</TableColumnHeaderCell>
                <TableColumnHeaderCell>Released</TableColumnHeaderCell>
                <TableColumnHeaderCell>Welper net</TableColumnHeaderCell>
                <TableColumnHeaderCell>Platform net</TableColumnHeaderCell>
                <TableColumnHeaderCell>Status</TableColumnHeaderCell>
                <TableColumnHeaderCell>Stripe transfer</TableColumnHeaderCell>
                <TableColumnHeaderCell>Details</TableColumnHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {welper.lines.map((line) => (
                <TableRow key={line.ledgerId}>
                  <TableCell>
                    <Link href={`/bookings/${line.bookingId}`}>{shortId(line.bookingId)}</Link>
                  </TableCell>
                  <TableCell>{formatAdminDateTime(line.paymentReleasedAt)}</TableCell>
                  <TableCell>{formatAdminMoneyCents(line.welperNetCents, "CAD")}</TableCell>
                  <TableCell>{formatAdminMoneyCents(line.platformNetCents, "CAD")}</TableCell>
                  <TableCell>
                    {formatAdminStatusLabel(line.status)}
                    {line.exclusionReason ? ` (${line.exclusionReason})` : ""}
                  </TableCell>
                  <TableCell>
                    <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                      {line.stripeTransferId ?? "—"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <PayoutLineDetailsButton line={line} welperLabel={welper.welperEmail ?? welper.welperId} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ))}
    </Flex>
  );
}
