import {
  Badge,
  Button,
  Card,
  Flex,
  Separator,
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
import { NativeFormField, nativeInputProps, nativeSelectProps } from "@/components/native-form-field";
import { searchAdminBookings } from "@/lib/services/admin-booking-service";
import { BookingIdJump } from "./booking-id-jump";

export const dynamic = "force-dynamic";

const LIMIT = 25;

const BOOKING_STATUSES = [
  "",
  "pending",
  "accepted",
  "in_progress",
  "completed",
  "payment_released",
  "declined",
  "cancelled",
  "disputed",
  "no_show",
] as const;

const QUICK_PRESETS: { label: string; query: Record<string, string | undefined> }[] = [
  { label: "Pending", query: { status: "pending" } },
  { label: "In progress", query: { status: "in_progress" } },
  { label: "Disputed", query: { status: "disputed" } },
  { label: "Cancelled", query: { status: "cancelled" } },
];

export default async function BookingsSearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    customerId?: string;
    welperId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const customerId = sp.customerId?.trim() || undefined;
  const welperId = sp.welperId?.trim() || undefined;
  const status =
    sp.status && BOOKING_STATUSES.includes(sp.status as (typeof BOOKING_STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  const dateFrom = sp.dateFrom?.trim() || undefined;
  const dateTo = sp.dateTo?.trim() || undefined;

  let list;
  let err: string | null = null;
  try {
    list = await searchAdminBookings({
      page,
      limit: LIMIT,
      customerId,
      welperId,
      status,
      dateFrom,
      dateTo,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load bookings";
    list = { data: [], total: 0, page: 1, limit: LIMIT, totalPages: 1 };
  }

  const buildHref = (p: number, overrides?: Record<string, string | undefined>) => {
    const merged = {
      customerId,
      welperId,
      status,
      dateFrom,
      dateTo,
      ...overrides,
    };
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (merged.customerId) q.set("customerId", merged.customerId);
    if (merged.welperId) q.set("welperId", merged.welperId);
    if (merged.status) q.set("status", merged.status);
    if (merged.dateFrom) q.set("dateFrom", merged.dateFrom);
    if (merged.dateTo) q.set("dateTo", merged.dateTo);
    const qs = q.toString();
    return qs ? `/bookings?${qs}` : "/bookings";
  };

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader title="Bookings" />

      <Flex gap="2" wrap="wrap">
        {QUICK_PRESETS.map((preset) => (
          <Button key={preset.label} asChild size="1" variant="soft">
            <Link href={buildHref(1, preset.query)}>{preset.label}</Link>
          </Button>
        ))}
      </Flex>

      <Card size="2">
        <Flex direction="column" gap="4">
          <form method="get">
            <Flex gap="4" wrap="wrap" align="end">
              <NativeFormField label="Customer ID">
                <input name="customerId" defaultValue={customerId ?? ""} {...nativeInputProps()} />
              </NativeFormField>
              <NativeFormField label="Welper ID">
                <input name="welperId" defaultValue={welperId ?? ""} {...nativeInputProps()} />
              </NativeFormField>
              <NativeFormField label="Status">
                <select name="status" defaultValue={status ?? ""} {...nativeSelectProps()}>
                  <option value="">Any</option>
                  {BOOKING_STATUSES.filter(Boolean).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </NativeFormField>
              <NativeFormField label="Scheduled from">
                <input type="date" name="dateFrom" defaultValue={dateFrom ?? ""} {...nativeInputProps()} />
              </NativeFormField>
              <NativeFormField label="Scheduled to">
                <input type="date" name="dateTo" defaultValue={dateTo ?? ""} {...nativeInputProps()} />
              </NativeFormField>
              <Button type="submit" variant="soft">
                Apply filters
              </Button>
            </Flex>
          </form>
          <Separator size="4" />
          <BookingIdJump />
        </Flex>
      </Card>

      <Text size="2" color="gray">
        {list.total} bookings · showing {list.data.length} · page {list.page} of {list.totalPages}
      </Text>
      {err ? <AdminErrorCallout message={err} /> : null}

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Status</TableColumnHeaderCell>
              <TableColumnHeaderCell>Scheduled</TableColumnHeaderCell>
              <TableColumnHeaderCell>Customer</TableColumnHeaderCell>
              <TableColumnHeaderCell>Welper</TableColumnHeaderCell>
              <TableColumnHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Text color="gray">No bookings match.</Text>
                </TableCell>
              </TableRow>
            ) : (
              list.data.map((b, idx) => {
                const id = String(b.id ?? "");
                return (
                  <TableRow key={id || `booking-${idx}`}>
                    <TableCell>
                      <Badge variant="soft" size="1">
                        {String(b.status ?? "—")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text size="1" color="gray">
                        {b.scheduledDate != null ? String(b.scheduledDate) : "—"}
                      </Text>
                    </TableCell>
                    <TableCell>
                      {typeof b.customerId === "string" ? (
                        <Link href={`/users/${b.customerId}`}>
                          <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                            {b.customerId.slice(0, 8)}…
                          </Text>
                        </Link>
                      ) : (
                        <Text size="1" color="gray">
                          —
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>
                      {typeof b.welperId === "string" ? (
                        <Link href={`/users/${b.welperId}`}>
                          <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                            {b.welperId.slice(0, 8)}…
                          </Text>
                        </Link>
                      ) : (
                        <Text size="1" color="gray">
                          —
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>{id ? <Link href={`/bookings/${id}`}>View</Link> : null}</TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      <Flex gap="3">
        {list.page > 1 ? (
          <Button asChild variant="soft">
            <Link href={buildHref(list.page - 1)}>Previous</Link>
          </Button>
        ) : null}
        {list.page < list.totalPages ? (
          <Button asChild variant="soft">
            <Link href={buildHref(list.page + 1)}>Next</Link>
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}
