import {
  Badge,
  Button,
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
import { AdminDateTime } from "@/components/admin-date-time";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { NativeFormField, nativeSelectProps } from "@/components/native-form-field";
import { formatAdminMoneyCents, formatAdminStatusLabel } from "@/lib/admin-format";
import { listDisputes } from "@/lib/services/dispute-service";

export const dynamic = "force-dynamic";

const LIMIT = 25;

const STATUS_OPTIONS = [
  "",
  "open",
  "in-review",
  "escalated",
  "awaiting-refund",
  "awaiting-recovery",
  "resolved",
  "closed",
] as const;

export default async function DisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const status =
    sp.status && STATUS_OPTIONS.includes(sp.status as (typeof STATUS_OPTIONS)[number]) && sp.status !== ""
      ? sp.status
      : undefined;

  let list;
  let err: string | null = null;
  try {
    list = await listDisputes(page, LIMIT, status);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load disputes";
    list = { data: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  }

  const buildHref = (p: number, st?: string) => {
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (st) q.set("status", st);
    const qs = q.toString();
    return qs ? `/disputes?${qs}` : "/disputes";
  };

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Disputes"
        description="Review and resolve booking disputes. Filter by status or open a row for full details and resolution actions."
      />

      <Card size="2">
        <form method="get">
          <Flex gap="4" wrap="wrap" align="end">
            <NativeFormField label="Status">
              <select name="status" defaultValue={status ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                {STATUS_OPTIONS.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <Button type="submit" variant="soft">
              Apply filters
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/disputes">Clear</Link>
            </Button>
          </Flex>
        </form>
      </Card>

      <Text size="2" color="gray">
        {list.total} total · page {list.page} of {list.totalPages}
      </Text>
      {err ? <AdminErrorCallout message={err} /> : null}

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Status</TableColumnHeaderCell>
              <TableColumnHeaderCell>Subject</TableColumnHeaderCell>
              <TableColumnHeaderCell>Filer</TableColumnHeaderCell>
              <TableColumnHeaderCell>Booking</TableColumnHeaderCell>
              <TableColumnHeaderCell>Captured</TableColumnHeaderCell>
              <TableColumnHeaderCell>Alerts</TableColumnHeaderCell>
              <TableColumnHeaderCell>Category</TableColumnHeaderCell>
              <TableColumnHeaderCell>Updated</TableColumnHeaderCell>
              <TableColumnHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Text color="gray">No disputes found.</Text>
                </TableCell>
              </TableRow>
            ) : (
              list.data.map((d) => (
                <TableRow key={d.id}>
                  <TableCell>
                    <Badge variant="soft">{formatAdminStatusLabel(d.status)}</Badge>
                  </TableCell>
                  <TableCell>{d.subject}</TableCell>
                  <TableCell>
                    <Link href={`/users/${d.filerId}`}>
                      <Text size="1">{d.filerType}</Text>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/bookings/${d.bookingId}`}>
                      <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                        {d.bookingId.slice(0, 8)}…
                      </Text>
                    </Link>
                    {d.bookingStatus ? (
                      <Text size="1" color="gray" as="div" mt="1">
                        {formatAdminStatusLabel(d.bookingStatus)}
                      </Text>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {d.capturedPayment
                      ? formatAdminMoneyCents(
                          d.capturedPayment.totalCents,
                          d.capturedPayment.currency,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {d.bookingCancelledWithOpenDispute ? (
                      <Badge
                        variant="soft"
                        color="red"
                        title="Participant cancelled the booking while this dispute was still open"
                      >
                        Cancelled + open dispute
                      </Badge>
                    ) : (
                      <Text size="1" color="gray">
                        —
                      </Text>
                    )}
                  </TableCell>
                  <TableCell>{d.category}</TableCell>
                  <TableCell>
                    <Text size="1" color="gray">
                      <AdminDateTime value={d.updatedAt} />
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Link href={`/disputes/${d.id}`}>Open</Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Flex gap="3">
        {list.page > 1 ? (
          <Button asChild variant="soft">
            <Link href={buildHref(list.page - 1, status)}>Previous</Link>
          </Button>
        ) : null}
        {list.page < list.totalPages ? (
          <Button asChild variant="soft">
            <Link href={buildHref(list.page + 1, status)}>Next</Link>
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}
