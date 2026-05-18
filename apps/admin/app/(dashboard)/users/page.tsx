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
import {
  BACKGROUND_CHECK_STATUSES,
  formatSignupStepsProgress,
  listAdminUsers,
  type AdminUsersSortBy,
  type AdminUsersSortDir,
} from "@/lib/services/admin-users-service";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const SORTABLE_COLUMNS = [
  "email",
  "status",
  "createdAt",
  "signupSteps",
] as const satisfies readonly AdminUsersSortBy[];

const ACCOUNT_TYPES = ["", "Customer", "Welper", "Guardian", "Admin"] as const;
const STATUSES = ["", "Pending", "Active", "Suspended", "Deactivated"] as const;

const QUICK_PRESETS: { label: string; query: Record<string, string> }[] = [
  {
    label: "Welpers · Pending",
    query: { accountType: "Welper", status: "Pending" },
  },
  {
    label: "Welpers · signup incomplete",
    query: { accountType: "Welper", signupCompleted: "false" },
  },
  {
    label: "Welpers · BG in progress",
    query: { accountType: "Welper", backgroundCheckStatus: "In Progress" },
  },
  {
    label: "Welpers · BG failed",
    query: { accountType: "Welper", backgroundCheckStatus: "Failed" },
  },
];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    accountType?: string;
    status?: string;
    emailVerified?: string;
    signupCompleted?: string;
    backgroundCheckStatus?: string;
    search?: string;
    offset?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}) {
  const sp = await searchParams;
  const offsetRaw = parseInt(sp.offset ?? "0", 10);
  const offset = Number.isFinite(offsetRaw) && offsetRaw >= 0 ? offsetRaw : 0;
  const search = sp.search?.trim() || undefined;

  const accountType =
    sp.accountType && ACCOUNT_TYPES.includes(sp.accountType as (typeof ACCOUNT_TYPES)[number]) && sp.accountType !== ""
      ? sp.accountType
      : undefined;
  const status =
    sp.status && STATUSES.includes(sp.status as (typeof STATUSES)[number]) && sp.status !== ""
      ? sp.status
      : undefined;
  let emailVerified: boolean | undefined;
  if (sp.emailVerified === "true") emailVerified = true;
  else if (sp.emailVerified === "false") emailVerified = false;

  let signupCompleted: boolean | undefined;
  if (sp.signupCompleted === "true") signupCompleted = true;
  else if (sp.signupCompleted === "false") signupCompleted = false;

  const backgroundCheckStatus =
    sp.backgroundCheckStatus &&
    BACKGROUND_CHECK_STATUSES.includes(
      sp.backgroundCheckStatus as (typeof BACKGROUND_CHECK_STATUSES)[number],
    )
      ? sp.backgroundCheckStatus
      : undefined;

  const sortBy =
    sp.sortBy && SORTABLE_COLUMNS.includes(sp.sortBy as (typeof SORTABLE_COLUMNS)[number])
      ? (sp.sortBy as AdminUsersSortBy)
      : "createdAt";
  const sortDir: AdminUsersSortDir =
    sp.sortDir === "asc" || sp.sortDir === "desc" ? sp.sortDir : "desc";

  let data;
  let err: string | null = null;
  try {
    data = await listAdminUsers({
      limit: PAGE_SIZE,
      offset,
      accountType,
      status,
      emailVerified,
      signupCompleted,
      backgroundCheckStatus,
      search,
      sortBy,
      sortDir,
    });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load users";
    data = { users: [], total: 0 };
  }

  const nextOffset = offset + PAGE_SIZE;
  const prevOffset = Math.max(0, offset - PAGE_SIZE);
  const hasNext = nextOffset < data.total;
  const hasPrev = offset > 0;

  const buildHref = (o: number, overrides?: Record<string, string | undefined>) => {
    const q = new URLSearchParams();
    const merged = {
      accountType,
      status,
      emailVerified: sp.emailVerified,
      signupCompleted: sp.signupCompleted,
      backgroundCheckStatus,
      search,
      sortBy,
      sortDir,
      ...overrides,
    };
    if (merged.accountType) q.set("accountType", merged.accountType);
    if (merged.status) q.set("status", merged.status);
    if (merged.emailVerified === "true" || merged.emailVerified === "false") {
      q.set("emailVerified", merged.emailVerified);
    }
    if (merged.signupCompleted === "true" || merged.signupCompleted === "false") {
      q.set("signupCompleted", merged.signupCompleted);
    }
    if (merged.backgroundCheckStatus) q.set("backgroundCheckStatus", merged.backgroundCheckStatus);
    if (merged.search) q.set("search", merged.search);
    if (merged.sortBy && merged.sortBy !== "createdAt") q.set("sortBy", merged.sortBy);
    if (merged.sortDir && merged.sortDir !== "desc") q.set("sortDir", merged.sortDir);
    if (o > 0) q.set("offset", String(o));
    const qs = q.toString();
    return qs ? `/users?${qs}` : "/users";
  };

  const sortHref = (column: AdminUsersSortBy) => {
    const nextDir: AdminUsersSortDir =
      sortBy === column && sortDir === "desc" ? "asc" : "desc";
    return buildHref(0, { sortBy: column, sortDir: nextDir, offset: undefined });
  };

  const sortIndicator = (column: AdminUsersSortBy) => {
    if (sortBy !== column) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Users"
        actions={
          <Button asChild>
            <Link href="/users/new">Create admin</Link>
          </Button>
        }
      />

      <Flex gap="2" wrap="wrap">
        {QUICK_PRESETS.map((preset) => (
          <Button key={preset.label} asChild size="1" variant="soft">
            <Link href={buildHref(0, preset.query)}>{preset.label}</Link>
          </Button>
        ))}
      </Flex>

      <Card size="2">
        <form method="get">
          <Flex gap="4" wrap="wrap" align="end">
            <NativeFormField label="Account type">
              <select name="accountType" defaultValue={accountType ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                {ACCOUNT_TYPES.filter(Boolean).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Status">
              <select name="status" defaultValue={status ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                {STATUSES.filter(Boolean).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Email verified">
              <select name="emailVerified" defaultValue={sp.emailVerified ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </NativeFormField>
            <NativeFormField label="Signup complete">
              <select name="signupCompleted" defaultValue={sp.signupCompleted ?? ""} {...nativeSelectProps()}>
                <option value="">All</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </NativeFormField>
            <NativeFormField label="BG status">
              <select
                name="backgroundCheckStatus"
                defaultValue={backgroundCheckStatus ?? ""}
                {...nativeSelectProps()}
              >
                <option value="">All</option>
                {BACKGROUND_CHECK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </NativeFormField>
            <NativeFormField label="Search (email or user ID)">
              <input
                type="search"
                name="search"
                defaultValue={search ?? ""}
                placeholder="user@example.com or UUID"
                autoComplete="off"
                {...nativeInputProps()}
              />
            </NativeFormField>
            <Button type="submit" variant="soft">
              Apply filters
            </Button>
          </Flex>
        </form>
      </Card>

      <Text size="2" color="gray">
        {data.total} accounts · showing {data.users.length} (offset {offset})
      </Text>
      {err ? <AdminErrorCallout message={err} /> : null}

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>
                <Link href={sortHref("email")}>Email{sortIndicator("email")}</Link>
              </TableColumnHeaderCell>
              <TableColumnHeaderCell>Type</TableColumnHeaderCell>
              <TableColumnHeaderCell>
                <Link href={sortHref("status")}>Status{sortIndicator("status")}</Link>
              </TableColumnHeaderCell>
              <TableColumnHeaderCell>Signup</TableColumnHeaderCell>
              <TableColumnHeaderCell>
                <Link href={sortHref("signupSteps")}>
                  Onboarding{sortIndicator("signupSteps")}
                </Link>
              </TableColumnHeaderCell>
              <TableColumnHeaderCell>Verified</TableColumnHeaderCell>
              <TableColumnHeaderCell>BG paid</TableColumnHeaderCell>
              <TableColumnHeaderCell>BG status</TableColumnHeaderCell>
              <TableColumnHeaderCell>Locale</TableColumnHeaderCell>
              <TableColumnHeaderCell>
                <Link href={sortHref("createdAt")}>Created{sortIndicator("createdAt")}</Link>
              </TableColumnHeaderCell>
              <TableColumnHeaderCell />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11}>
                  <Text color="gray">No users.</Text>
                </TableCell>
              </TableRow>
            ) : (
              data.users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant="soft">{u.accountType}</Badge>
                  </TableCell>
                  <TableCell>{u.status}</TableCell>
                  <TableCell>{u.signupCompleted ? "Yes" : "No"}</TableCell>
                  <TableCell>{formatSignupStepsProgress(u)}</TableCell>
                  <TableCell>{u.emailVerified ? "Yes" : "No"}</TableCell>
                  <TableCell>
                    {u.backgroundCheckPaid === null ? "—" : u.backgroundCheckPaid ? "Yes" : "No"}
                  </TableCell>
                  <TableCell>
                    <Text size="1">
                      {u.accountType === "Welper" ? (u.backgroundCheckStatus ?? "—") : "—"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text size="1">{u.preferredLocale ?? "—"}</Text>
                  </TableCell>
                  <TableCell>
                    <Text size="1" color="gray">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Link href={`/users/${u.id}`}>View</Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Flex gap="3">
        {hasPrev ? (
          <Button asChild variant="soft">
            <Link href={buildHref(prevOffset)}>Previous</Link>
          </Button>
        ) : null}
        {hasNext ? (
          <Button asChild variant="soft">
            <Link href={buildHref(nextOffset)}>Next</Link>
          </Button>
        ) : null}
      </Flex>
    </Flex>
  );
}
