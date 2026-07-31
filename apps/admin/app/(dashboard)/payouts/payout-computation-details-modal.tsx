"use client";

import {
  Button,
  Dialog,
  DialogContent,
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
import { useState } from "react";
import { AdminDateTime } from "@/components/admin-date-time";
import {
  formatAdminMoneyCents,
  formatAdminStatusLabel,
  shortId,
} from "@/lib/admin-format";
import type { PayoutBatchLine, PayoutWelperRollup } from "@/lib/services/admin-payouts-service";

function SummaryRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Flex justify="between" align="start" gap="3" style={{ padding: "0.35rem 0" }}>
      <div>
        <Text size="2">{label}</Text>
        {hint ? (
          <Text size="1" color="gray" style={{ display: "block" }}>
            {hint}
          </Text>
        ) : null}
      </div>
      <Text size="2" weight="medium">
        {value}
      </Text>
    </Flex>
  );
}

export function PayoutComputationDetailsModal({
  welper,
  open,
  onOpenChange,
}: {
  welper: PayoutWelperRollup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const customerSubtotalCents = welper.lines.reduce((s, l) => s + l.customerSubtotalCents, 0);
  const customerTaxCents = welper.lines.reduce((s, l) => s + l.customerTaxCents, 0);
  const welperGrossCents = welper.lines.reduce((s, l) => s + l.welperGrossCents, 0);
  const welperRefundCents = welper.lines.reduce((s, l) => s + l.welperRefundCents, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title="Payout computation"
        description={welper.welperEmail ?? welper.welperId}
        style={{ maxWidth: 720 }}
      >
        <Text size="2" color="gray">
          Customer subtotal is split 80% welper / 20% platform (25% markup on welper rate). Tax is
          collected from the customer and is not part of the welper transfer. Stripe fees reduce
          platform net only.
        </Text>

        <Flex direction="column" gap="1" className="admin-card" style={{ padding: "1rem" }}>
          <Text size="2" weight="medium" style={{ marginBottom: "0.25rem" }}>
            Welper transfer (Stripe)
          </Text>
          <SummaryRow
            label="Welper net (sum of lines)"
            value={formatAdminMoneyCents(welper.welperNetCents, "CAD")}
            hint="= welper gross − refunds, per booking"
          />
          <SummaryRow
            label="Welper gross (80% of customer subtotal)"
            value={formatAdminMoneyCents(welperGrossCents, "CAD")}
          />
          {welperRefundCents > 0 ? (
            <SummaryRow
              label="Welper refunds"
              value={`−${formatAdminMoneyCents(welperRefundCents, "CAD")}`}
            />
          ) : null}
        </Flex>

        <Flex direction="column" gap="1" className="admin-card" style={{ padding: "1rem" }}>
          <Text size="2" weight="medium" style={{ marginBottom: "0.25rem" }}>
            Customer &amp; platform (reference)
          </Text>
          <SummaryRow
            label="Customer subtotal (pre-tax service)"
            value={formatAdminMoneyCents(customerSubtotalCents, "CAD")}
          />
          <SummaryRow
            label="Customer tax"
            value={formatAdminMoneyCents(customerTaxCents, "CAD")}
            hint="Not included in welper transfer"
          />
          <SummaryRow
            label="Customer total captured"
            value={formatAdminMoneyCents(welper.customerCapturedCents, "CAD")}
          />
          <SummaryRow
            label="Platform gross (20% of subtotal)"
            value={formatAdminMoneyCents(welper.platformGrossCents, "CAD")}
          />
          <SummaryRow
            label="Stripe processing fees"
            value={`−${formatAdminMoneyCents(welper.stripeFeeCents, "CAD")}`}
          />
          <SummaryRow
            label="Platform net"
            value={formatAdminMoneyCents(welper.platformNetCents, "CAD")}
            hint="Platform gross − Stripe fees"
          />
        </Flex>

        <Flex direction="column" gap="2">
          <Text size="2" weight="medium">
            By booking ({welper.bookingCount})
          </Text>
          <Table>
            <TableHeader>
              <TableRow>
                <TableColumnHeaderCell>Booking</TableColumnHeaderCell>
                <TableColumnHeaderCell>Subtotal</TableColumnHeaderCell>
                <TableColumnHeaderCell>Welper net</TableColumnHeaderCell>
                <TableColumnHeaderCell>Platform net</TableColumnHeaderCell>
                <TableColumnHeaderCell>Status</TableColumnHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {welper.lines.map((line) => (
                <TableRow key={line.ledgerId}>
                  <TableCell>
                    <Link href={`/bookings/${line.bookingId}`}>{shortId(line.bookingId)}</Link>
                    <Text size="1" color="gray" style={{ display: "block" }}>
                      <AdminDateTime value={line.paymentReleasedAt} />
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text size="2">{formatAdminMoneyCents(line.customerSubtotalCents, "CAD")}</Text>
                    <Text size="1" color="gray" style={{ display: "block" }}>
                      tax {formatAdminMoneyCents(line.customerTaxCents, "CAD")} · total{" "}
                      {formatAdminMoneyCents(line.customerTotalCents, "CAD")}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text size="2">{formatAdminMoneyCents(line.welperNetCents, "CAD")}</Text>
                    <Text size="1" color="gray" style={{ display: "block" }}>
                      gross {formatAdminMoneyCents(line.welperGrossCents, "CAD")}
                      {line.welperRefundCents > 0
                        ? ` − refund ${formatAdminMoneyCents(line.welperRefundCents, "CAD")}`
                        : ""}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text size="2">{formatAdminMoneyCents(line.platformNetCents, "CAD")}</Text>
                    <Text size="1" color="gray" style={{ display: "block" }}>
                      fee {formatAdminMoneyCents(line.platformGrossCents, "CAD")} − Stripe{" "}
                      {formatAdminMoneyCents(line.stripeFeeCents, "CAD")}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {formatAdminStatusLabel(line.status)}
                    {line.exclusionReason ? (
                      <Text size="1" color="gray" style={{ display: "block" }}>
                        {line.exclusionReason}
                      </Text>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Flex>

        <Flex justify="end">
          <Button type="button" variant="soft" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}

export function PayoutLineDetailsButton({
  line,
  welperLabel,
}: {
  line: PayoutBatchLine;
  welperLabel?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="soft" size="1" onClick={() => setOpen(true)}>
        Details
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          title="Booking payout computation"
          description={welperLabel ?? undefined}
          style={{ maxWidth: 520 }}
        >
          <Text size="2" color="gray">
            One booking line. Welper transfer uses 80% of customer subtotal (pre-tax), minus any
            refunds. Platform keeps 20% of subtotal minus Stripe fees.
          </Text>

          <Flex direction="column" gap="1" className="admin-card" style={{ padding: "1rem" }}>
            <SummaryRow
              label="Customer subtotal (pre-tax service)"
              value={formatAdminMoneyCents(line.customerSubtotalCents, "CAD")}
            />
            <SummaryRow
              label="Customer tax"
              value={formatAdminMoneyCents(line.customerTaxCents, "CAD")}
              hint="Not part of welper transfer"
            />
            <SummaryRow
              label="Customer total captured"
              value={formatAdminMoneyCents(line.customerTotalCents, "CAD")}
            />
            <SummaryRow
              label="Welper gross (80%)"
              value={formatAdminMoneyCents(line.welperGrossCents, "CAD")}
            />
            {line.welperRefundCents > 0 ? (
              <SummaryRow
                label="Welper refunds"
                value={`−${formatAdminMoneyCents(line.welperRefundCents, "CAD")}`}
              />
            ) : null}
            <SummaryRow
              label="Welper net (transfer share)"
              value={formatAdminMoneyCents(line.welperNetCents, "CAD")}
            />
            <SummaryRow
              label="Platform gross (20%)"
              value={formatAdminMoneyCents(line.platformGrossCents, "CAD")}
            />
            <SummaryRow
              label="Stripe fee"
              value={`−${formatAdminMoneyCents(line.stripeFeeCents, "CAD")}`}
            />
            <SummaryRow
              label="Platform net"
              value={formatAdminMoneyCents(line.platformNetCents, "CAD")}
            />
          </Flex>

          <Text size="2" color="gray">
            Released <AdminDateTime value={line.paymentReleasedAt} /> ·{" "}
            <Link href={`/bookings/${line.bookingId}`}>Booking {shortId(line.bookingId)}</Link>
          </Text>

          <Flex justify="end">
            <Button type="button" variant="soft" onClick={() => setOpen(false)}>
              Close
            </Button>
          </Flex>
        </DialogContent>
      </Dialog>
    </>
  );
}
export function PayoutWelperDetailsButton({ welper }: { welper: PayoutWelperRollup }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="soft" size="1" onClick={() => setOpen(true)}>
        Details
      </Button>
      <PayoutComputationDetailsModal welper={welper} open={open} onOpenChange={setOpen} />
    </>
  );
}
