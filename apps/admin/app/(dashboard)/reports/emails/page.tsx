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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import Link from "next/link";
import { NativeFormField, nativeInputProps } from "@/components/native-form-field";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  getResendEmailsReport,
  RESEND_EMAIL_LAST_EVENTS,
  type ResendEmailLastEvent,
  type ResendEmailsReport,
} from "@/lib/services/admin-reports-service";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const ALL_FILTER_VALUE = "__all__";
const CONTROL_STYLE: React.CSSProperties = { width: "100%" };

const EMPTY_REPORT: ResendEmailsReport = {
  emails: [],
  hasMore: false,
  nextCursor: null,
  prevCursor: null,
  filters: { limit: 25 },
  stats: {
    sampleSize: 0,
    byLastEvent: {},
    deliveredOrOpened: 0,
    bouncedOrFailed: 0,
    opened: 0,
    clicked: 0,
  },
  generatedAt: new Date(0).toISOString(),
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-CA");
}

function eventColor(
  event: ResendEmailLastEvent,
): "green" | "red" | "amber" | "blue" | "gray" {
  if (event === "delivered" || event === "opened" || event === "clicked") {
    return "green";
  }
  if (event === "bounced" || event === "failed" || event === "complained") {
    return "red";
  }
  if (event === "delivery_delayed" || event === "queued" || event === "scheduled") {
    return "amber";
  }
  if (event === "sent") return "blue";
  return "gray";
}

function summaryCard(label: string, value: number, hint: string) {
  return (
    <Card size="2">
      <Flex direction="column" gap="1">
        <Text size="1" color="gray">
          {label}
        </Text>
        <Text size="6" weight="bold">
          {formatNumber(value)}
        </Text>
        <Text size="1" color="gray">
          {hint}
        </Text>
      </Flex>
    </Card>
  );
}

function buildListHref(params: {
  to?: string;
  lastEvent?: string;
  after?: string;
  before?: string;
}): string {
  const q = new URLSearchParams();
  if (params.to) q.set("to", params.to);
  if (params.lastEvent && params.lastEvent !== ALL_FILTER_VALUE) {
    q.set("lastEvent", params.lastEvent);
  }
  if (params.after) q.set("after", params.after);
  if (params.before) q.set("before", params.before);
  const qs = q.toString();
  return qs ? `/reports/emails?${qs}` : "/reports/emails";
}

export default async function ResendEmailsReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    to?: string;
    lastEvent?: string;
    after?: string;
    before?: string;
  }>;
}) {
  const sp = await searchParams;
  const to = sp.to?.trim() || undefined;
  const lastEvent =
    sp.lastEvent &&
    RESEND_EMAIL_LAST_EVENTS.includes(sp.lastEvent as ResendEmailLastEvent)
      ? (sp.lastEvent as ResendEmailLastEvent)
      : undefined;
  const after = sp.after?.trim() || undefined;
  const before = sp.before?.trim() || undefined;

  let report = EMPTY_REPORT;
  let err: string | null = null;
  try {
    report = await getResendEmailsReport({
      to,
      lastEvent,
      after,
      before,
      limit: 25,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load sent emails";
  }

  const filterTo = to ?? report.filters.to;
  const filterLastEvent = lastEvent ?? report.filters.lastEvent;

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Sent emails"
        description="Transactional emails from Resend. Stats are computed from the latest 100 sends."
      />

      {err ? <AdminErrorCallout message={err} /> : null}

      <div className={styles.summaryGrid}>
        {summaryCard(
          "Sample size",
          report.stats.sampleSize,
          "Latest sends scanned",
        )}
        {summaryCard(
          "Delivered / opened",
          report.stats.deliveredOrOpened,
          "delivered + opened + clicked",
        )}
        {summaryCard(
          "Opened",
          report.stats.opened,
          "opened or clicked last event",
        )}
        {summaryCard(
          "Bounced / failed",
          report.stats.bouncedOrFailed,
          "bounced + failed + suppressed",
        )}
      </div>

      <Card size="3">
        <form method="get">
          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            align={{ sm: "end" }}
            wrap="wrap"
          >
            <NativeFormField label="Recipient contains">
              <input
                name="to"
                defaultValue={filterTo ?? ""}
                placeholder="user@example.com"
                {...nativeInputProps()}
                style={{ ...nativeInputProps().style, ...CONTROL_STYLE }}
              />
            </NativeFormField>
            <NativeFormField label="Last event">
              <Select
                name="lastEvent"
                defaultValue={filterLastEvent ?? ALL_FILTER_VALUE}
              >
                <SelectTrigger style={CONTROL_STYLE} />
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>Any</SelectItem>
                  {RESEND_EMAIL_LAST_EVENTS.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NativeFormField>
            <Button type="submit">Apply</Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/reports/emails">Clear</Link>
            </Button>
          </Flex>
        </form>
      </Card>

      <Card size="3">
        <Flex direction="column" gap="3">
          <Text size="4" weight="bold">
            Recent emails
          </Text>
          {report.emails.length === 0 ? (
            <Text color="gray">No emails match these filters.</Text>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableColumnHeaderCell>Sent</TableColumnHeaderCell>
                  <TableColumnHeaderCell>To</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Subject</TableColumnHeaderCell>
                  <TableColumnHeaderCell>Status</TableColumnHeaderCell>
                  <TableColumnHeaderCell />
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.emails.map((email) => (
                  <TableRow key={email.id}>
                    <TableCell>{formatDateTime(email.createdAt)}</TableCell>
                    <TableCell>
                      <Text className={styles.mono} size="2">
                        {email.to.join(", ")}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text weight="medium">{email.subject || "(no subject)"}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge color={eventColor(email.lastEvent)}>
                        {email.lastEvent}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Link href={`/reports/emails/${email.id}`}>Preview</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          <Flex gap="2" wrap="wrap">
            {before || after ? (
              <Button asChild variant="soft">
                <Link
                  href={buildListHref({
                    to: filterTo,
                    lastEvent: filterLastEvent,
                  })}
                >
                  Newest
                </Link>
              </Button>
            ) : null}
            {report.prevCursor && (after || before) ? (
              <Button asChild variant="soft">
                <Link
                  href={buildListHref({
                    to: filterTo,
                    lastEvent: filterLastEvent,
                    before: report.prevCursor,
                  })}
                >
                  Previous
                </Link>
              </Button>
            ) : null}
            {report.hasMore && report.nextCursor ? (
              <Button asChild variant="soft">
                <Link
                  href={buildListHref({
                    to: filterTo,
                    lastEvent: filterLastEvent,
                    after: report.nextCursor,
                  })}
                >
                  Next
                </Link>
              </Button>
            ) : null}
          </Flex>
        </Flex>
      </Card>

      {report.generatedAt !== EMPTY_REPORT.generatedAt ? (
        <Text size="1" color="gray">
          Generated {new Date(report.generatedAt).toLocaleString("en-CA")} ·
          recipient/event filters apply to the current page only
        </Text>
      ) : null}
    </Flex>
  );
}
