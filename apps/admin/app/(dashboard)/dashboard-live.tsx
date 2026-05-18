"use client";

import {
  Badge,
  Button,
  Card,
  Flex,
  Grid,
  Heading,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumnHeaderCell,
  TableHeader,
  TableRow,
  Text,
} from "@welpco/ui";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { AdminErrorCallout } from "@/components/admin-callout";
import { getAdminDashboardSnapshot } from "@/lib/services/admin-dashboard-service";
import { listAdminAuditLogs, type AdminAuditEntry } from "@/lib/services/admin-audit-service";

const LIVE_STORAGE_KEY = "welpco-admin-dashboard-live";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card size="2">
      <Text size="1" color="gray">
        {label}
      </Text>
      <Heading size="6" weight="bold" mt="1">
        {value}
      </Heading>
    </Card>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Heading size="3" mt="5" mb="3">
      {children}
    </Heading>
  );
}

function AuditTable({ rows }: { rows: AdminAuditEntry[] }) {
  if (rows.length === 0) {
    return (
      <Text size="2" color="gray">
        No recent entries.
      </Text>
    );
  }
  return (
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
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell style={{ whiteSpace: "nowrap" }}>
              <Text size="1">{new Date(r.createdAt).toLocaleString()}</Text>
            </TableCell>
            <TableCell>
              <Badge variant="soft" size="1">
                {r.action}
              </Badge>
            </TableCell>
            <TableCell>
              <Link href={`/users/${r.actorUserId}`}>
                <Text size="1" style={{ fontFamily: "ui-monospace, monospace" }}>
                  {r.actorUserId.slice(0, 8)}…
                </Text>
              </Link>
            </TableCell>
            <TableCell style={{ maxWidth: 280, wordBreak: "break-word" }}>
              <Text size="1">{r.metadata ? JSON.stringify(r.metadata) : "—"}</Text>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function DashboardLive() {
  const [live, setLive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const v = localStorage.getItem(LIVE_STORAGE_KEY);
        setLive(v === "1" || v === "true");
      } catch {
        setLive(false);
      }
      setHydrated(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const setLivePersist = useCallback((next: boolean) => {
    setLive(next);
    try {
      localStorage.setItem(LIVE_STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const refetchInterval = useCallback(() => {
    if (!live) return false;
    if (typeof document !== "undefined" && document.visibilityState !== "visible") return false;
    return 5000;
  }, [live]);

  const dashboardQuery = useQuery({
    queryKey: ["adminDashboard", live],
    queryFn: getAdminDashboardSnapshot,
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: live ? 0 : 60_000,
  });

  const auditQuery = useQuery({
    queryKey: ["adminAuditRecent", live],
    queryFn: () => listAdminAuditLogs({ page: 1, limit: 12 }),
    refetchInterval,
    refetchIntervalInBackground: false,
    staleTime: live ? 0 : 60_000,
  });

  const snap = dashboardQuery.data;
  const err = dashboardQuery.error instanceof Error ? dashboardQuery.error.message : null;

  return (
    <Flex direction="column" gap="4">
      <Text size="2" color="gray" style={{ maxWidth: 640 }}>
        Welper launch overview. Manage accounts in <Link href="/users">Users</Link> and review actions in{" "}
        <Link href="/audit-logs">Audit</Link>.
      </Text>

      <Flex align="center" gap="4" wrap="wrap">
        <Text as="label" size="2">
          <Flex gap="2" align="center">
            <Switch
              checked={live}
              disabled={!hydrated}
              onCheckedChange={(checked) => setLivePersist(checked === true)}
            />
            Live updates (every 5s when this tab is visible)
          </Flex>
        </Text>
        <Button
          type="button"
          size="1"
          variant="soft"
          onClick={() => {
            void dashboardQuery.refetch();
            void auditQuery.refetch();
          }}
          disabled={dashboardQuery.isFetching}
        >
          {dashboardQuery.isFetching ? "Refreshing…" : "Refresh now"}
        </Button>
        {snap ? (
          <Text size="1" color="gray">
            Last snapshot: {new Date(snap.generatedAt).toLocaleString()}
          </Text>
        ) : null}
      </Flex>

      {err ? <AdminErrorCallout message={err} /> : null}

      {dashboardQuery.isLoading && !snap ? (
        <Text color="gray">Loading metrics…</Text>
      ) : null}

      {snap ? (
        <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
          <Link href="/users?accountType=Welper&status=Pending" style={{ textDecoration: "none", color: "inherit" }}>
            <StatCard label="Welpers pending" value={snap.users.welpersPending} />
          </Link>
          <Link
            href="/users?accountType=Welper&signupCompleted=false"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <StatCard label="Signup incomplete" value={snap.users.welpersSignupIncomplete} />
          </Link>
          <Link
            href="/users?accountType=Welper&backgroundCheckStatus=In+Progress"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <StatCard label="BG in progress" value={snap.users.welpersBgInProgress} />
          </Link>
          <Link
            href="/users?accountType=Welper&backgroundCheckStatus=Failed"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <StatCard label="BG failed" value={snap.users.welpersBgFailed} />
          </Link>
        </Grid>
      ) : null}

      <SectionTitle>Recent admin actions</SectionTitle>
      <Card size="2">
        <Flex direction="column" gap="3">
          {auditQuery.isLoading ? (
            <Text color="gray">Loading audit…</Text>
          ) : auditQuery.error instanceof Error ? (
            <AdminErrorCallout message={auditQuery.error.message} />
          ) : (
            <AuditTable rows={auditQuery.data?.data ?? []} />
          )}
          <Text size="2">
            <Link href="/audit-logs">View all audit logs →</Link>
          </Text>
        </Flex>
      </Card>
    </Flex>
  );
}
