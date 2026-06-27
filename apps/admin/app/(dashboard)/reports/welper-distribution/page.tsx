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
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { NativeFormField, nativeInputProps, nativeSelectProps } from "@/components/native-form-field";
import { listCategories, type AdminCategory } from "@/lib/services/admin-categories-service";
import {
  getWelperDistributionReport,
  WELPER_DISTRIBUTION_MAP_STYLES,
  WELPER_DISTRIBUTION_SCOPES,
  type WelperDistributionBucket,
  type WelperDistributionMapStyle,
  type WelperDistributionQuery,
  type WelperDistributionReport,
  type WelperDistributionScope,
} from "@/lib/services/admin-reports-service";
import { BACKGROUND_CHECK_STATUSES } from "@/lib/services/admin-users-service";
import { WelperDistributionMap } from "./welper-distribution-map";

export const dynamic = "force-dynamic";

const STATUSES = ["", "Pending", "Active", "Suspended", "Deactivated"] as const;

const EMPTY_REPORT: WelperDistributionReport = {
  scope: "discoverable",
  filters: { scope: "discoverable" },
  summary: {
    total: 0,
    active: 0,
    discoverable: 0,
    signupIncomplete: 0,
    pendingBackgroundCheck: 0,
    missingCoordinates: 0,
  },
  buckets: [],
  generatedAt: new Date(0).toISOString(),
};

function parseBoolean(value?: string): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

function flattenCategories(
  categories: AdminCategory[],
  depth = 0,
  seen = new Set<string>(),
): Array<AdminCategory & { depth: number }> {
  return categories.flatMap((category) => {
    if (seen.has(category.id)) {
      return flattenCategories(category.children ?? [], depth + 1, seen);
    }
    seen.add(category.id);
    return [
      { ...category, depth },
      ...flattenCategories(category.children ?? [], depth + 1, seen),
    ];
  });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-CA").format(value);
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

function buildUsersHref(
  bucket: WelperDistributionBucket,
  query: WelperDistributionQuery,
) {
  const q = new URLSearchParams();
  q.set("accountType", "Welper");

  if (query.scope === "discoverable") q.set("discoverable", "true");
  if (query.scope === "active") q.set("status", "Active");
  if (query.status) q.set("status", query.status);
  if (typeof query.signupCompleted === "boolean") {
    q.set("signupCompleted", String(query.signupCompleted));
  }
  if (typeof query.emailVerified === "boolean") {
    q.set("emailVerified", String(query.emailVerified));
  }
  if (query.backgroundCheckStatus) {
    q.set("backgroundCheckStatus", query.backgroundCheckStatus);
  }
  if (bucket.provinceCode !== "Unknown") q.set("provinceCode", bucket.provinceCode);
  if (bucket.city !== "Unknown") q.set("city", bucket.city);

  return `/users?${q.toString()}`;
}

function buildHiddenInputs(
  query: WelperDistributionQuery,
): Array<[string, string]> {
  const entries: Array<[string, string]> = [];
  if (query.scope) entries.push(["scope", query.scope]);
  if (query.status) entries.push(["status", query.status]);
  if (typeof query.signupCompleted === "boolean") {
    entries.push(["signupCompleted", String(query.signupCompleted)]);
  }
  if (typeof query.emailVerified === "boolean") {
    entries.push(["emailVerified", String(query.emailVerified)]);
  }
  if (query.backgroundCheckStatus) {
    entries.push(["backgroundCheckStatus", query.backgroundCheckStatus]);
  }
  if (query.serviceCategoryId) {
    entries.push(["serviceCategoryId", query.serviceCategoryId]);
  }
  if (query.provinceCode) entries.push(["provinceCode", query.provinceCode]);
  if (query.city) entries.push(["city", query.city]);
  return entries;
}

export default async function WelperDistributionReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    scope?: string;
    status?: string;
    signupCompleted?: string;
    emailVerified?: string;
    backgroundCheckStatus?: string;
    serviceCategoryId?: string;
    provinceCode?: string;
    city?: string;
    mapStyle?: string;
  }>;
}) {
  const sp = await searchParams;
  const scope: WelperDistributionScope =
    sp.scope &&
    WELPER_DISTRIBUTION_SCOPES.includes(sp.scope as WelperDistributionScope)
      ? (sp.scope as WelperDistributionScope)
      : "discoverable";
  const status =
    sp.status && STATUSES.includes(sp.status as (typeof STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  const backgroundCheckStatus =
    sp.backgroundCheckStatus &&
    BACKGROUND_CHECK_STATUSES.includes(
      sp.backgroundCheckStatus as (typeof BACKGROUND_CHECK_STATUSES)[number],
    )
      ? sp.backgroundCheckStatus
      : undefined;
  const mapStyle: WelperDistributionMapStyle =
    sp.mapStyle &&
    WELPER_DISTRIBUTION_MAP_STYLES.includes(sp.mapStyle as WelperDistributionMapStyle)
      ? (sp.mapStyle as WelperDistributionMapStyle)
      : "light";

  const query: WelperDistributionQuery = {
    scope,
    status,
    signupCompleted: parseBoolean(sp.signupCompleted),
    emailVerified: parseBoolean(sp.emailVerified),
    backgroundCheckStatus,
    serviceCategoryId: sp.serviceCategoryId?.trim() || undefined,
    provinceCode: sp.provinceCode?.trim() || undefined,
    city: sp.city?.trim() || undefined,
  };

  let report = EMPTY_REPORT;
  let categories: AdminCategory[] = [];
  let err: string | null = null;
  try {
    [report, categories] = await Promise.all([
      getWelperDistributionReport(query),
      listCategories(false),
    ]);
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load welper distribution";
  }

  const categoryOptions = flattenCategories(categories);
  const mappableCount = report.buckets.filter(
    (bucket) => bucket.latitude != null && bucket.longitude != null,
  ).length;
  const hiddenInputs = buildHiddenInputs(query);

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Welper Distribution"
        description="Operational view of welper supply by aggregate service area. Map markers are city/province buckets only."
        actions={
          <Button asChild variant="soft">
            <Link href="/reports">All reports</Link>
          </Button>
        }
      />

      <Card size="2">
        <form method="get">
          <input type="hidden" name="mapStyle" value={mapStyle} />
          <Flex gap="4" wrap="wrap" align="end">
            <NativeFormField label="Scope">
              <select name="scope" defaultValue={scope} {...nativeSelectProps()}>
                <option value="discoverable">Discoverable / ready</option>
                <option value="active">Active accounts</option>
                <option value="all">All welpers</option>
              </select>
            </NativeFormField>
            <NativeFormField label="Account status">
              <select name="status" defaultValue={status ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                {STATUSES.filter(Boolean).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Signup complete">
              <select name="signupCompleted" defaultValue={sp.signupCompleted ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </NativeFormField>
            <NativeFormField label="Email verified">
              <select name="emailVerified" defaultValue={sp.emailVerified ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </NativeFormField>
            <NativeFormField label="Background check">
              <select
                name="backgroundCheckStatus"
                defaultValue={backgroundCheckStatus ?? ""}
                {...nativeSelectProps()}
              >
                <option value="">All</option>
                {BACKGROUND_CHECK_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Service category">
              <select
                name="serviceCategoryId"
                defaultValue={query.serviceCategoryId ?? ""}
                {...nativeSelectProps()}
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {"\u00a0".repeat(category.depth * 2)}
                    {category.name}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Province">
              <input
                name="provinceCode"
                defaultValue={query.provinceCode ?? ""}
                placeholder="ON"
                maxLength={8}
                {...nativeInputProps()}
              />
            </NativeFormField>
            <NativeFormField label="City">
              <input
                name="city"
                defaultValue={query.city ?? ""}
                placeholder="Toronto"
                {...nativeInputProps()}
              />
            </NativeFormField>
            <Button type="submit" variant="soft">
              Apply filters
            </Button>
            <Button asChild type="button" variant="ghost">
              <Link href="/reports/welper-distribution">Clear</Link>
            </Button>
          </Flex>
        </form>
      </Card>

      {err ? <AdminErrorCallout message={err} /> : null}

      <Flex gap="3" wrap="wrap">
        {summaryCard("Total in scope", report.summary.total, "Welpers matching filters")}
        {summaryCard("Discoverable", report.summary.discoverable, "Ready for public supply")}
        {summaryCard("Active", report.summary.active, "Active account status")}
        {summaryCard("Signup incomplete", report.summary.signupIncomplete, "Need onboarding follow-up")}
        {summaryCard(
          "Pending BG",
          report.summary.pendingBackgroundCheck,
          "Pending or in progress",
        )}
        {summaryCard(
          "Missing coordinates",
          report.summary.missingCoordinates,
          "Counted, not mapped",
        )}
      </Flex>

      <Card size="2">
        <Flex direction="column" gap="3">
          <Flex justify="between" gap="3" wrap="wrap">
            <Text weight="bold">Map</Text>
            <Text size="2" color="gray">
              {mappableCount} mapped area buckets · generated{" "}
              {report.generatedAt === EMPTY_REPORT.generatedAt
                ? "after load failure"
                : new Date(report.generatedAt).toLocaleString()}
            </Text>
          </Flex>
          <form method="get">
            {hiddenInputs.map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={value} />
            ))}
            <Flex gap="3" wrap="wrap" align="end">
              <NativeFormField label="Map style">
                <select name="mapStyle" defaultValue={mapStyle} {...nativeSelectProps()}>
                  <option value="light">Light muted (recommended)</option>
                  <option value="standard">Standard</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="minimal">Minimal</option>
                </select>
              </NativeFormField>
              <Button type="submit" variant="soft">
                Apply map style
              </Button>
            </Flex>
          </form>
          <WelperDistributionMap buckets={report.buckets} mapStyle={mapStyle} />
          <Text size="1" color="gray">
            Coordinates are area centroids averaged from stored welper profile
            coordinates. The API does not return welper IDs or individual
            coordinates for this report.
          </Text>
        </Flex>
      </Card>

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>Area</TableColumnHeaderCell>
              <TableColumnHeaderCell>Welpers</TableColumnHeaderCell>
              <TableColumnHeaderCell>Discoverable</TableColumnHeaderCell>
              <TableColumnHeaderCell>Active</TableColumnHeaderCell>
              <TableColumnHeaderCell>Signup incomplete</TableColumnHeaderCell>
              <TableColumnHeaderCell>BG pending</TableColumnHeaderCell>
              <TableColumnHeaderCell>Missing coords</TableColumnHeaderCell>
              <TableColumnHeaderCell>Status mix</TableColumnHeaderCell>
              <TableColumnHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.buckets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9}>
                  <Text color="gray">No welper area buckets match these filters.</Text>
                </TableCell>
              </TableRow>
            ) : (
              report.buckets.map((bucket) => (
                <TableRow key={`${bucket.countryCode}:${bucket.provinceCode}:${bucket.city}`}>
                  <TableCell>
                    <Text weight="medium">{bucket.city}</Text>
                    <Text size="1" color="gray" as="div">
                      {bucket.provinceCode}, {bucket.countryCode}
                    </Text>
                  </TableCell>
                  <TableCell>{formatNumber(bucket.welperCount)}</TableCell>
                  <TableCell>{formatNumber(bucket.discoverableCount)}</TableCell>
                  <TableCell>{formatNumber(bucket.activeCount)}</TableCell>
                  <TableCell>{formatNumber(bucket.signupIncompleteCount)}</TableCell>
                  <TableCell>{formatNumber(bucket.pendingBackgroundCheckCount)}</TableCell>
                  <TableCell>{formatNumber(bucket.missingCoordinateCount)}</TableCell>
                  <TableCell>
                    <Flex gap="1" wrap="wrap">
                      {Object.entries(bucket.statusBreakdown)
                        .filter(([, count]) => count > 0)
                        .map(([statusName, count]) => (
                          <Badge key={statusName} variant="soft" color="gray">
                            {statusName}: {formatNumber(count)}
                          </Badge>
                        ))}
                    </Flex>
                  </TableCell>
                  <TableCell>
                    <Link href={buildUsersHref(bucket, query)}>View users</Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </Flex>
  );
}
