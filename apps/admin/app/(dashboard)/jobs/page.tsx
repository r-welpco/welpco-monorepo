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
import { AdminDateTime } from "@/components/admin-date-time";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { NativeFormField, nativeInputProps, nativeSelectProps } from "@/components/native-form-field";
import { formatAdminStatusLabel, shortId } from "@/lib/admin-format";
import { searchAdminJobs } from "@/lib/services/admin-job-service";

export const dynamic = "force-dynamic";

const LIMIT = 25;

const JOB_STATUSES = [
  "",
  "published",
  "applications_open",
  "converted_to_booking",
  "completed",
  "expired",
  "cancelled",
] as const;

const QUICK_PRESETS: { label: string; query: Record<string, string | undefined> }[] = [
  { label: "Open", query: { status: "applications_open" } },
  { label: "Published", query: { status: "published" } },
  { label: "Converted", query: { status: "converted_to_booking" } },
  { label: "Expired", query: { status: "expired" } },
  { label: "Cancelled", query: { status: "cancelled" } },
];

function statusColor(status: string): "blue" | "green" | "gray" | "red" | "amber" {
  switch (status) {
    case "published":
    case "applications_open":
      return "blue";
    case "converted_to_booking":
    case "completed":
      return "green";
    case "expired":
      return "gray";
    case "cancelled":
      return "red";
    default:
      return "amber";
  }
}

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    customerId?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;
  const customerId = sp.customerId?.trim() || undefined;
  const status =
    sp.status && JOB_STATUSES.includes(sp.status as (typeof JOB_STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  const dateFrom = sp.dateFrom?.trim() || undefined;
  const dateTo = sp.dateTo?.trim() || undefined;

  let list;
  let err: string | null = null;
  try {
    list = await searchAdminJobs({ page, limit: LIMIT, customerId, status, dateFrom, dateTo });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load jobs";
  }

  const totalPages = list?.totalPages ?? 1;
  const buildHref = (p: number, overrides?: Record<string, string | undefined>) => {
    const merged = {
      customerId,
      status,
      dateFrom,
      dateTo,
      ...overrides,
    };
    const q = new URLSearchParams();
    if (p > 1) q.set("page", String(p));
    if (merged.customerId) q.set("customerId", merged.customerId);
    if (merged.status) q.set("status", merged.status);
    if (merged.dateFrom) q.set("dateFrom", merged.dateFrom);
    if (merged.dateTo) q.set("dateTo", merged.dateTo);
    const qs = q.toString();
    return qs ? `/jobs?${qs}` : "/jobs";
  };

  return (
    <Flex direction="column" gap="5">
      <AdminPageHeader title="Jobs" description="Marketplace job postings (read-only)" />

      <Flex gap="2" wrap="wrap">
        {QUICK_PRESETS.map((preset) => (
          <Button key={preset.label} asChild size="1" variant="soft">
            <Link href={buildHref(1, preset.query)}>{preset.label}</Link>
          </Button>
        ))}
      </Flex>

      <Card size="2">
        <form method="get">
          <Flex gap="4" wrap="wrap" align="end">
            <NativeFormField label="Customer ID">
              <input name="customerId" defaultValue={customerId ?? ""} {...nativeInputProps()} />
            </NativeFormField>
            <NativeFormField label="Status">
              <select name="status" defaultValue={status ?? ""} {...nativeSelectProps()}>
                {JOB_STATUSES.map((s) => (
                  <option key={s || "all"} value={s}>
                    {s || "All statuses"}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Created from">
              <input type="date" name="dateFrom" defaultValue={dateFrom ?? ""} {...nativeInputProps()} />
            </NativeFormField>
            <NativeFormField label="Created to">
              <input type="date" name="dateTo" defaultValue={dateTo ?? ""} {...nativeInputProps()} />
            </NativeFormField>
            <Button type="submit" variant="soft">
              Apply filters
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/jobs">Clear</Link>
            </Button>
          </Flex>
        </form>
      </Card>

      {err ? <AdminErrorCallout message={err} /> : null}

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Job</TableColumnHeaderCell>
              <TableColumnHeaderCell>Customer</TableColumnHeaderCell>
              <TableColumnHeaderCell>Category</TableColumnHeaderCell>
              <TableColumnHeaderCell>Status</TableColumnHeaderCell>
              <TableColumnHeaderCell>Schedule</TableColumnHeaderCell>
              <TableColumnHeaderCell>Location</TableColumnHeaderCell>
              <TableColumnHeaderCell>Apps</TableColumnHeaderCell>
              <TableColumnHeaderCell>Booking</TableColumnHeaderCell>
              <TableColumnHeaderCell>Published</TableColumnHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(list?.data ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Text color="gray">No jobs match.</Text>
                </TableCell>
              </TableRow>
            ) : (
              (list?.data ?? []).map((job) => (
                <TableRow key={job.id}>
                  <TableCell>
                    <Link href={`/jobs/${job.id}`}>
                      <Text weight="medium">{job.title}</Text>
                    </Link>
                    <Text size="1" color="gray">
                      {shortId(job.id)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    {job.customerId ? (
                      <Link href={`/users/${job.customerId}`}>{shortId(job.customerId)}</Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <Text size="2">
                      {job.subcategoryLabel ?? job.categoryLabel ?? job.subcategoryId.slice(0, 8)}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Badge color={statusColor(job.status)} variant="soft" size="1">
                      {formatAdminStatusLabel(job.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Text size="1">
                      {job.scheduledDate} · {job.scheduledStartTime}–{job.scheduledEndTime}
                    </Text>
                    <Text size="1" color="gray">
                      {job.durationMinutes} min
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text size="1">
                      {[job.locationCity, job.locationRegion].filter(Boolean).join(", ") || "—"}
                    </Text>
                  </TableCell>
                  <TableCell>{job.applicationCount}</TableCell>
                  <TableCell>
                    {job.bookingId ? (
                      <Link href={`/bookings/${job.bookingId}`}>{shortId(job.bookingId)}</Link>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>
                    <AdminDateTime value={job.publishedAt} dateOnly />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <Separator size="4" my="3" />

        <Flex justify="between" align="center" px="3" pb="3">
          <Text size="2" color="gray">
            Page {page} of {totalPages} · {list?.total ?? 0} total
          </Text>
          <Flex gap="2">
            {page > 1 ? (
              <Button asChild variant="soft" size="2">
                <Link href={buildHref(page - 1)}>Previous</Link>
              </Button>
            ) : null}
            {page < totalPages ? (
              <Button asChild variant="soft" size="2">
                <Link href={buildHref(page + 1)}>Next</Link>
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
