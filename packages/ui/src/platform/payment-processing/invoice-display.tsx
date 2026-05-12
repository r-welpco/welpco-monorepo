"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumnHeaderCell,
  TableCell,
} from "@welpco/ui/table";

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceDisplayProps {
  invoiceNumber: string;
  date: string;
  dueDate?: string;
  status: "draft" | "pending" | "paid" | "overdue" | "cancelled";
  customerName: string;
  customerEmail?: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  notes?: string;
}

const statusColors: Record<
  InvoiceDisplayProps["status"],
  "gray" | "amber" | "green" | "red"
> = {
  draft: "gray",
  pending: "amber",
  paid: "green",
  overdue: "red",
  cancelled: "gray",
};

const statusLabels: Record<InvoiceDisplayProps["status"], string> = {
  draft: "Draft",
  pending: "Pending",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const formatMoney = (n: number): string => `$${n.toFixed(2)}`;

/**
 * Invoice document. Bible §20.3 (price transparency) — every charge
 * component (subtotal, discount, tax, total) shown on its own line; the
 * grand total is visually emphasized as the primary number on the page.
 */
export function InvoiceDisplay({
  invoiceNumber,
  date,
  dueDate,
  status,
  customerName,
  customerEmail,
  customerAddress,
  items,
  subtotal,
  tax,
  discount,
  total,
  notes,
}: InvoiceDisplayProps) {
  return (
    <Card size="4" style={{ width: "100%", maxWidth: "800px" }}>
      <Flex direction="column" gap="5">
        {/* Header: invoice id + dates + status */}
        <Flex justify="between" align="start" gap="3" wrap="wrap">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="6" mb="1" trim="start">
              Invoice #{invoiceNumber}
            </Heading>
            <Text size="2" color="gray" highContrast>
              Issued {date}
              {dueDate && ` · Due ${dueDate}`}
            </Text>
          </Box>
          <Badge color={statusColors[status]} variant="soft" size="2" highContrast>
            {statusLabels[status]}
          </Badge>
        </Flex>

        <Separator />

        {/* Bill-to block */}
        <Box>
          <Text size="2" weight="bold" mb="1" as="div">
            Bill to
          </Text>
          <Text size="2" as="div">
            {customerName}
          </Text>
          {customerEmail && (
            <Text size="2" color="gray" highContrast as="div">
              {customerEmail}
            </Text>
          )}
          {customerAddress && (
            <Text size="2" color="gray" highContrast as="div">
              {customerAddress}
            </Text>
          )}
        </Box>

        {/* Desktop table (md+) */}
        <Box display={{ initial: "none", md: "block" }}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableColumnHeaderCell>Description</TableColumnHeaderCell>
                <TableColumnHeaderCell justify="end">Qty</TableColumnHeaderCell>
                <TableColumnHeaderCell justify="end">Unit price</TableColumnHeaderCell>
                <TableColumnHeaderCell justify="end">Total</TableColumnHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, idx) => (
                <TableRow key={idx}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell justify="end">{item.quantity}</TableCell>
                  <TableCell justify="end">{formatMoney(item.unitPrice)}</TableCell>
                  <TableCell justify="end">{formatMoney(item.total)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>

        {/* Mobile card list (<md) — description as title, qty/price as metadata */}
        <Box display={{ initial: "block", md: "none" }} asChild>
          <Flex direction="column" gap="2">
            {items.map((item, idx) => (
              <Card key={idx} size="2">
                <Flex direction="column" gap="2">
                  <Flex justify="between" align="start" gap="3">
                    <Box flexGrow="1" style={{ minWidth: 0 }}>
                      <Text size="2" weight="medium" as="div">
                        {item.description}
                      </Text>
                      <Text size="1" color="gray" highContrast as="div">
                        {item.quantity} × {formatMoney(item.unitPrice)}
                      </Text>
                    </Box>
                    <Text size="2" weight="bold" align="right" style={{ flexShrink: 0 }}>
                      {formatMoney(item.total)}
                    </Text>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        </Box>

        {/* Totals — right-aligned column */}
        <Flex justify="end">
          <Flex direction="column" gap="2" style={{ minWidth: "240px" }}>
            <Flex justify="between">
              <Text size="2" color="gray" highContrast>Subtotal</Text>
              <Text size="2">{formatMoney(subtotal)}</Text>
            </Flex>
            {discount != null && discount > 0 && (
              <Flex justify="between">
                <Text size="2" color="gray" highContrast>Discount</Text>
                <Text size="2" color={SEMANTIC_COLOR.success}>
                  −{formatMoney(discount)}
                </Text>
              </Flex>
            )}
            {tax != null && tax > 0 && (
              <Flex justify="between">
                <Text size="2" color="gray" highContrast>Tax</Text>
                <Text size="2">{formatMoney(tax)}</Text>
              </Flex>
            )}
            <Separator />
            <Flex justify="between" align="baseline">
              <Heading size="5" mb="0">
                Total
              </Heading>
              <Heading size="5" mb="0">
                {formatMoney(total)}
              </Heading>
            </Flex>
          </Flex>
        </Flex>

        {notes && (
          <Box>
            <Text size="2" weight="bold" mb="1" as="div">
              Notes
            </Text>
            <Text size="2" color="gray" highContrast>
              {notes}
            </Text>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

InvoiceDisplay.displayName = "InvoiceDisplay";
