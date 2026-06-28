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
import { NativeFormField, nativeInputProps } from "@/components/native-form-field";
import Link from "next/link";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
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
import { ServiceCategoryFilter } from "./service-category-filter";
import { WelperDistributionMap } from "./welper-distribution-map";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

const STATUSES = ["", "Pending", "Active", "Suspended", "Deactivated"] as const;
const ALL_FILTER_VALUE = "__all__";
const CONTROL_STYLE: React.CSSProperties = {
  width: "100%",
};

function filterInputProps(): React.InputHTMLAttributes<HTMLInputElement> {
  const base = nativeInputProps();
  return {
    ...base,
    style: { ...base.style, ...CONTROL_STYLE, minWidth: 0 },
  };
}

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

function normalizeFilterValue(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed || trimmed === ALL_FILTER_VALUE) return undefined;
  return trimmed;
}

function parseBoolean(value?: string): boolean | undefined {
  const normalized = normalizeFilterValue(value);
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
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
  if (query.serviceSubcategoryId) {
    entries.push(["serviceSubcategoryId", query.serviceSubcategoryId]);
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
    serviceSubcategoryId?: string;
    provinceCode?: string;
    city?: string;
    mapStyle?: string;
  }>;
}) {
  const sp = await searchParams;
  const normalizedStatus = normalizeFilterValue(sp.status);
  const normalizedBackgroundCheckStatus = normalizeFilterValue(sp.backgroundCheckStatus);
  const scope: WelperDistributionScope =
    sp.scope &&
    WELPER_DISTRIBUTION_SCOPES.includes(sp.scope as WelperDistributionScope)
      ? (sp.scope as WelperDistributionScope)
      : "discoverable";
  const status =
    normalizedStatus &&
    STATUSES.includes(normalizedStatus as (typeof STATUSES)[number])
      ? normalizedStatus
      : undefined;
  const backgroundCheckStatus =
    normalizedBackgroundCheckStatus &&
    BACKGROUND_CHECK_STATUSES.includes(
      normalizedBackgroundCheckStatus as (typeof BACKGROUND_CHECK_STATUSES)[number],
    )
      ? normalizedBackgroundCheckStatus
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
    serviceCategoryId: normalizeFilterValue(sp.serviceCategoryId),
    serviceSubcategoryId: normalizeFilterValue(sp.serviceSubcategoryId),
    provinceCode: normalizeFilterValue(sp.provinceCode),
    city: normalizeFilterValue(sp.city),
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

      <div className={styles.reportShell}>
        <aside className={styles.filterSidebar}>
          <Card size="2">
            <Flex direction="column" gap="3">
              <Flex direction="column" gap="1">
                <Text weight="bold">Filters</Text>
                <Text size="1" color="gray">
                  Narrow the operational supply view.
                </Text>
              </Flex>
              <form method="get" className={styles.filterForm}>
                <input type="hidden" name="mapStyle" value={mapStyle} />
                <NativeFormField label="Scope">
                  <Select name="scope" defaultValue={scope}>
                    <SelectTrigger style={CONTROL_STYLE} />
                    <SelectContent>
                      <SelectItem value="discoverable">Discoverable / ready</SelectItem>
                      <SelectItem value="active">Active accounts</SelectItem>
                      <SelectItem value="all">All welpers</SelectItem>
                    </SelectContent>
                  </Select>
                </NativeFormField>
                <ServiceCategoryFilter
                  categories={categories}
                  selectedCategoryId={query.serviceCategoryId}
                  selectedSubcategoryId={query.serviceSubcategoryId}
                />
                <NativeFormField label="Province">
                  <input
                    name="provinceCode"
                    defaultValue={query.provinceCode ?? ""}
                    placeholder="ON"
                    maxLength={8}
                    {...filterInputProps()}
                  />
                </NativeFormField>
                <NativeFormField label="City">
                  <input
                    name="city"
                    defaultValue={query.city ?? ""}
                    placeholder="Toronto"
                    {...filterInputProps()}
                  />
                </NativeFormField>
                <NativeFormField label="Account status">
                  <Select name="status" defaultValue={status ?? ALL_FILTER_VALUE}>
                    <SelectTrigger style={CONTROL_STYLE} />
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                      {STATUSES.filter(Boolean).map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </NativeFormField>
                <NativeFormField label="Signup complete">
                  <Select
                    name="signupCompleted"
                    defaultValue={
                      typeof query.signupCompleted === "boolean"
                        ? String(query.signupCompleted)
                        : ALL_FILTER_VALUE
                    }
                  >
                    <SelectTrigger style={CONTROL_STYLE} />
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </NativeFormField>
                <NativeFormField label="Email verified">
                  <Select
                    name="emailVerified"
                    defaultValue={
                      typeof query.emailVerified === "boolean"
                        ? String(query.emailVerified)
                        : ALL_FILTER_VALUE
                    }
                  >
                    <SelectTrigger style={CONTROL_STYLE} />
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">No</SelectItem>
                    </SelectContent>
                  </Select>
                </NativeFormField>
                <NativeFormField label="Background check">
                  <Select
                    name="backgroundCheckStatus"
                    defaultValue={backgroundCheckStatus ?? ALL_FILTER_VALUE}
                  >
                    <SelectTrigger style={CONTROL_STYLE} />
                    <SelectContent>
                      <SelectItem value={ALL_FILTER_VALUE}>All</SelectItem>
                      {BACKGROUND_CHECK_STATUSES.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </NativeFormField>
                <div className={styles.filterActions}>
                  <Button type="submit" variant="soft">
                    Apply
                  </Button>
                  <Button asChild type="button" variant="ghost">
                    <Link href="/reports/welper-distribution">Clear</Link>
                  </Button>
                </div>
              </form>
            </Flex>
          </Card>
        </aside>

        <div className={styles.reportContent}>
          <Flex direction="column" gap="4">
            {err ? <AdminErrorCallout message={err} /> : null}

            <div className={styles.summaryGrid}>
              {summaryCard("Total in scope", report.summary.total, "Welpers matching filters")}
              {summaryCard("Discoverable", report.summary.discoverable, "Ready for public supply")}
              {summaryCard("Active", report.summary.active, "Active account status")}
              {summaryCard(
                "Signup incomplete",
                report.summary.signupIncomplete,
                "Need onboarding follow-up",
              )}
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
            </div>

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
                      <Select name="mapStyle" defaultValue={mapStyle}>
                        <SelectTrigger style={{ minWidth: 220 }} />
                        <SelectContent>
                          <SelectItem value="light">Light muted (recommended)</SelectItem>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="grayscale">Grayscale</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                        </SelectContent>
                      </Select>
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
        </div>
      </div>
    </Flex>
  );
}
