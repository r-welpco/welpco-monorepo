import {
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
import { AdminDateTime } from "@/components/admin-date-time";
import { NativeFormField, nativeInputProps } from "@/components/native-form-field";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import {
  getWebAnalyticsReport,
  WEB_ANALYTICS_ENVIRONMENTS,
  type WebAnalyticsDailyRow,
  type WebAnalyticsEnvironment,
  type WebAnalyticsMetricRow,
  type WebAnalyticsQuery,
  type WebAnalyticsReport,
} from "@/lib/services/admin-reports-service";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const CONTROL_STYLE: React.CSSProperties = { width: "100%" };

const EMPTY_REPORT: WebAnalyticsReport = {
  since: "",
  until: "",
  environment: "production",
  summary: { pageviews: 0, visitors: 0 },
  daily: [],
  topPages: [],
  topReferrers: [],
  countries: [],
  devices: [],
  generatedAt: new Date(0).toISOString(),
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value);
}

function formatDateLabel(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return new Intl.DateTimeFormat("en-CA", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function defaultDateRange(): { since: string; until: string } {
  const until = new Date();
  const untilUtc = new Date(
    Date.UTC(until.getUTCFullYear(), until.getUTCMonth(), until.getUTCDate()),
  );
  const sinceUtc = new Date(untilUtc);
  sinceUtc.setUTCDate(sinceUtc.getUTCDate() - 6);
  return {
    since: sinceUtc.toISOString().slice(0, 10),
    until: untilUtc.toISOString().slice(0, 10),
  };
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

function MetricTable({
  title,
  rows,
  emptyLabel,
}: {
  title: string;
  rows: WebAnalyticsMetricRow[];
  emptyLabel: string;
}) {
  return (
    <Card size="3">
      <Flex direction="column" gap="3">
        <Text size="4" weight="bold">
          {title}
        </Text>
        {rows.length === 0 ? (
          <Text color="gray">{emptyLabel}</Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableColumnHeaderCell>Name</TableColumnHeaderCell>
                <TableColumnHeaderCell align="right">
                  Visitors
                </TableColumnHeaderCell>
                <TableColumnHeaderCell align="right">
                  Pageviews
                </TableColumnHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${title}-${row.label}`}>
                  <TableCell>
                    <Text
                      style={{
                        wordBreak: "break-word",
                        fontFamily: row.label.startsWith("/")
                          ? "var(--code-font-family)"
                          : undefined,
                      }}
                    >
                      {row.label}
                    </Text>
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(row.visitors)}
                  </TableCell>
                  <TableCell align="right">
                    {formatNumber(row.pageviews)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Flex>
    </Card>
  );
}

function DailyTrendTable({ rows }: { rows: WebAnalyticsDailyRow[] }) {
  const maxVisitors = Math.max(0, ...rows.map((row) => row.visitors));

  return (
    <Card size="3">
      <Flex direction="column" gap="3">
        <Text size="4" weight="bold">
          Daily trend
        </Text>
        {rows.length === 0 ? (
          <Text color="gray">No daily traffic in this range.</Text>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableColumnHeaderCell>Date</TableColumnHeaderCell>
                <TableColumnHeaderCell>Trend</TableColumnHeaderCell>
                <TableColumnHeaderCell align="right">
                  Visitors
                </TableColumnHeaderCell>
                <TableColumnHeaderCell align="right">
                  Pageviews
                </TableColumnHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const widthPct =
                  maxVisitors > 0
                    ? Math.max(2, Math.round((row.visitors / maxVisitors) * 100))
                    : 0;
                return (
                  <TableRow key={row.date}>
                    <TableCell>{formatDateLabel(row.date)}</TableCell>
                    <TableCell style={{ minWidth: "8rem" }}>
                      <span
                        className={styles.trendBar}
                        style={{ width: `${widthPct}%` }}
                        aria-hidden
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(row.visitors)}
                    </TableCell>
                    <TableCell align="right">
                      {formatNumber(row.pageviews)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Flex>
    </Card>
  );
}

export default async function WebAnalyticsReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    since?: string;
    until?: string;
    environment?: string;
  }>;
}) {
  const sp = await searchParams;
  const defaults = defaultDateRange();
  const since = sp.since?.trim() || defaults.since;
  const until = sp.until?.trim() || defaults.until;
  const environment: WebAnalyticsEnvironment =
    sp.environment &&
    WEB_ANALYTICS_ENVIRONMENTS.includes(
      sp.environment as WebAnalyticsEnvironment,
    )
      ? (sp.environment as WebAnalyticsEnvironment)
      : "production";

  const query: WebAnalyticsQuery = { since, until, environment };

  let report = EMPTY_REPORT;
  let err: string | null = null;
  try {
    report = await getWebAnalyticsReport(query);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load web analytics";
  }

  const rangeLabel =
    report.since && report.until
      ? `${formatDateLabel(report.since)} – ${formatDateLabel(report.until)}`
      : `${formatDateLabel(since)} – ${formatDateLabel(until)}`;

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Web Analytics"
        description="Production marketing traffic from Vercel Web Analytics (same data as the Vercel dashboard)."
      />

      {err ? <AdminErrorCallout message={err} /> : null}

      <Card size="3">
        <form method="get">
          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            align={{ sm: "end" }}
            wrap="wrap"
          >
            <NativeFormField label="From">
              <input
                type="date"
                name="since"
                defaultValue={since}
                {...nativeInputProps()}
                style={{ ...nativeInputProps().style, ...CONTROL_STYLE }}
              />
            </NativeFormField>
            <NativeFormField label="To">
              <input
                type="date"
                name="until"
                defaultValue={until}
                {...nativeInputProps()}
                style={{ ...nativeInputProps().style, ...CONTROL_STYLE }}
              />
            </NativeFormField>
            <NativeFormField label="Environment">
              <Select name="environment" defaultValue={environment}>
                <SelectTrigger style={CONTROL_STYLE} />
                <SelectContent>
                  {WEB_ANALYTICS_ENVIRONMENTS.map((env) => (
                    <SelectItem key={env} value={env}>
                      {env === "all" ? "All environments" : env}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </NativeFormField>
            <Button type="submit">Apply</Button>
          </Flex>
        </form>
      </Card>

      <div className={styles.summaryGrid}>
        {summaryCard(
          "Visitors",
          report.summary.visitors,
          `Unique visitors · ${rangeLabel}`,
        )}
        {summaryCard(
          "Pageviews",
          report.summary.pageviews,
          `Total views · ${rangeLabel}`,
        )}
      </div>

      <DailyTrendTable rows={report.daily} />

      <div className={styles.metricGrid}>
        <MetricTable
          title="Top pages"
          rows={report.topPages}
          emptyLabel="No page traffic in this range."
        />
        <MetricTable
          title="Top referrers"
          rows={report.topReferrers}
          emptyLabel="No referrer data in this range."
        />
        <MetricTable
          title="Countries"
          rows={report.countries}
          emptyLabel="No country data in this range."
        />
        <MetricTable
          title="Devices"
          rows={report.devices}
          emptyLabel="No device data in this range."
        />
      </div>

      {report.generatedAt && report.generatedAt !== EMPTY_REPORT.generatedAt ? (
        <Text size="1" color="gray">
          Generated <AdminDateTime value={report.generatedAt} /> ·
          environment {report.environment}
        </Text>
      ) : null}
    </Flex>
  );
}
