"use client";

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
import { formatAdminMoneyCents } from "@/lib/admin-format";
import type { PayoutWelperRollup } from "@/lib/services/admin-payouts-service";
import { PayoutWelperDetailsButton } from "./payout-computation-details-modal";

export function PayoutWelpersTable({
  welpers,
  batchId,
  title,
  emptyMessage,
}: {
  welpers: PayoutWelperRollup[];
  batchId?: string | null;
  title: string;
  emptyMessage: string;
}) {
  return (
    <Card style={{ padding: "1.25rem" }}>
      <Flex justify="between" align="center" wrap="wrap" gap="2" style={{ marginBottom: "0.75rem" }}>
        <Text size="3" weight="medium">
          {title}
        </Text>
        {batchId ? (
          <Link href={`/payouts/${batchId}`}>Open batch review →</Link>
        ) : null}
      </Flex>

      {welpers.length === 0 ? (
        <Text color="gray">{emptyMessage}</Text>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Welper</TableColumnHeaderCell>
              <TableColumnHeaderCell>Bookings</TableColumnHeaderCell>
              <TableColumnHeaderCell>Welper net</TableColumnHeaderCell>
              <TableColumnHeaderCell>Platform net</TableColumnHeaderCell>
              <TableColumnHeaderCell>Connect</TableColumnHeaderCell>
              <TableColumnHeaderCell>Details</TableColumnHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {welpers.map((welper) => (
              <TableRow key={welper.welperId}>
                <TableCell>
                  <Link href={`/users/${welper.welperId}`}>
                    {welper.welperEmail ?? welper.welperId}
                  </Link>
                </TableCell>
                <TableCell>{welper.bookingCount}</TableCell>
                <TableCell>{formatAdminMoneyCents(welper.welperNetCents, "CAD")}</TableCell>
                <TableCell>{formatAdminMoneyCents(welper.platformNetCents, "CAD")}</TableCell>
                <TableCell>
                  <Badge color={welper.connectReady ? "green" : "red"}>
                    {welper.connectReady ? "Ready" : "Missing"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <PayoutWelperDetailsButton welper={welper} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
