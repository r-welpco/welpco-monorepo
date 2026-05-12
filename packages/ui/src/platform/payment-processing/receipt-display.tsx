"use client";

import { Card } from "@welpco/ui/card";
import { Badge } from "@welpco/ui/badge";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Download, Printer } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableColumnHeaderCell,
  TableCell,
} from "@welpco/ui/table";

export interface ReceiptItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptDisplayProps {
  receiptNumber: string;
  date: string;
  paymentMethod: string;
  transactionId?: string;
  customerName: string;
  items: ReceiptItem[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
  onDownload?: () => void;
  onPrint?: () => void;
}

const formatMoney = (n: number): string => `$${n.toFixed(2)}`;

/**
 * Receipt of a completed payment. Mirrors invoice-display structure with a
 * Paid status pinned, payment-method + transaction-id surfaced, and download/
 * print actions in the canonical right-aligned action row.
 */
export function ReceiptDisplay({
  receiptNumber,
  date,
  paymentMethod,
  transactionId,
  customerName,
  items,
  subtotal,
  tax,
  discount,
  total,
  onDownload,
  onPrint,
}: ReceiptDisplayProps) {
  return (
    <Card size="4" style={{ width: "100%", maxWidth: "800px" }}>
      <Flex direction="column" gap="5">
        {/* Header */}
        <Flex justify="between" align="start" gap="3" wrap="wrap">
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Heading size="6" mb="1" trim="start">
              Receipt #{receiptNumber}
            </Heading>
            <Text size="2" color="gray" highContrast>
              {date}
              {transactionId && ` · Txn ${transactionId}`}
            </Text>
          </Box>
          <Badge color={SEMANTIC_COLOR.success} variant="soft" size="2" highContrast>
            Paid
          </Badge>
        </Flex>

        <Separator />

        {/* Customer + payment method, side by side on desktop */}
        <Flex
          direction={{ initial: "column", sm: "row" }}
          gap={{ initial: "3", sm: "6" }}
          wrap="wrap"
        >
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" mb="1" as="div">
              Customer
            </Text>
            <Text size="2" as="div">
              {customerName}
            </Text>
          </Box>
          <Box flexGrow="1" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" mb="1" as="div">
              Payment method
            </Text>
            <Text size="2" as="div">
              {paymentMethod}
            </Text>
          </Box>
        </Flex>

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

        {/* Mobile card list */}
        <Box display={{ initial: "block", md: "none" }} asChild>
          <Flex direction="column" gap="2">
            {items.map((item, idx) => (
              <Card key={idx} size="2">
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
              </Card>
            ))}
          </Flex>
        </Box>

        {/* Totals */}
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
              <Heading size="5" mb="0">Total paid</Heading>
              <Heading size="5" mb="0">{formatMoney(total)}</Heading>
            </Flex>
          </Flex>
        </Flex>

        {(onDownload || onPrint) && (
          <Flex gap="2" justify="end" wrap="wrap">
            {onPrint && (
              <Button variant="soft" color="gray" onClick={onPrint}>
                <Flex align="center" gap="2">
                  <Printer size={16} aria-hidden="true" />
                  Print
                </Flex>
              </Button>
            )}
            {onDownload && (
              <Button variant="solid" color={SEMANTIC_COLOR.primary} onClick={onDownload}>
                <Flex align="center" gap="2">
                  <Download size={16} aria-hidden="true" />
                  Download PDF
                </Flex>
              </Button>
            )}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

ReceiptDisplay.displayName = "ReceiptDisplay";
