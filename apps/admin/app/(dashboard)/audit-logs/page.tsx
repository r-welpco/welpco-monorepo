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
import Link from "next/link";
import { AdminErrorCallout } from "@/components/admin-callout";
import { AdminPageHeader } from "@/components/admin-page-header";
import { listAdminAuditLogs } from "@/lib/services/admin-audit-service";

export const dynamic = "force-dynamic";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const pageRaw = parseInt(sp.page ?? "1", 10);
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  let list;
  let err: string | null = null;
  try {
    list = await listAdminAuditLogs({ page, limit: 40 });
  } catch (e) {
    err = e instanceof Error ? e.message : "Failed to load audit log";
    list = { data: [], total: 0, page: 1, limit: 40, totalPages: 1 };
  }

  const buildHref = (p: number) => (p > 1 ? `/audit-logs?page=${p}` : "/audit-logs");

  return (
    <Flex direction="column" gap="4">
      <AdminPageHeader
        title="Audit log"
        description="Recent staff actions (user status, background check, unlock, payment delay, dispute resolutions). Requires admin_audit_logs migration applied."
      />
      <Text size="2" color="gray">
        {list.total} entries · page {list.page} of {list.totalPages}
      </Text>
      {err ? <AdminErrorCallout message={err} /> : null}

      <Card size="2" style={{ overflow: "auto" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableColumnHeaderCell>When</TableColumnHeaderCell>
              <TableColumnHeaderCell>Action</TableColumnHeaderCell>
              <TableColumnHeaderCell>Actor</TableColumnHeaderCell>
              <TableColumnHeaderCell>Details</TableColumnHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Text color="gray">No entries yet.</Text>
                </TableCell>
              </TableRow>
            ) : (
              list.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell style={{ whiteSpace: "nowrap" }}>
                    <Text size="1" color="gray">
                      {new Date(row.createdAt).toLocaleString()}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                      {row.action}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <Link href={`/users/${row.actorUserId}`}>
                      <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                        {row.actorUserId.slice(0, 8)}…
                      </Text>
                    </Link>
                  </TableCell>
                  <TableCell style={{ maxWidth: 360, wordBreak: "break-word" }}>
                    <Text size="1">{row.metadata ? JSON.stringify(row.metadata) : "—"}</Text>
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
