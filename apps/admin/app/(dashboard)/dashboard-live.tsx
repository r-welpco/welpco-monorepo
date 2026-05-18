"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { getAdminDashboardSnapshot } from "@/lib/services/admin-dashboard-service";
import { listAdminAuditLogs, type AdminAuditEntry } from "@/lib/services/admin-audit-service";

const LIVE_STORAGE_KEY = "welpco-admin-dashboard-live";

function formatMoney(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency.toUpperCase()}`;
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="admin-card" style={{ marginBottom: 0 }}>
      <p style={{ margin: 0, color: "var(--admin-muted)", fontSize: "0.85rem" }}>{label}</p>
      <p style={{ margin: "0.35rem 0 0", fontSize: "1.75rem", fontWeight: 600 }}>{value}</p>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: "1rem", marginTop: "1.75rem", marginBottom: "0.75rem" }}>{children}</h2>
  );
}

function AuditTable({ rows }: { rows: AdminAuditEntry[] }) {
  if (rows.length === 0) {
    return <p style={{ color: "var(--admin-muted)", fontSize: "0.9rem" }}>No recent entries.</p>;
  }
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="admin-table">
        <thead>
          <tr>
            <th>When</th>
            <th>Action</th>
            <th>Actor</th>
            <th>Details</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                {new Date(r.createdAt).toLocaleString()}
              </td>
              <td>
                <code style={{ fontSize: "0.75rem" }}>{r.action}</code>
              </td>
              <td style={{ fontFamily: "ui-monospace, monospace", fontSize: "0.75rem" }}>
                <Link href={`/users/${r.actorUserId}`}>{r.actorUserId.slice(0, 8)}…</Link>
              </td>
              <td style={{ fontSize: "0.8rem", maxWidth: 280, wordBreak: "break-word" }}>
                {r.metadata ? JSON.stringify(r.metadata) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DashboardLive() {
  const [live, setLive] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(LIVE_STORAGE_KEY);
      setLive(v === "1" || v === "true");
    } catch {
      setLive(false);
    }
    setHydrated(true);
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
    <div>
      <p style={{ color: "var(--admin-muted)", maxWidth: 640 }}>
        Welper launch overview. Manage accounts in{" "}
        <Link href="/users">Users</Link> and review actions in{" "}
        <Link href="/audit-logs">Audit</Link>.
      </p>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "1rem",
          marginTop: "1rem",
        }}
      >
        <label
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            fontSize: "0.9rem",
          }}
        >
          <input
            type="checkbox"
            checked={live}
            disabled={!hydrated}
            onChange={(e) => setLivePersist(e.target.checked)}
          />
          Live updates (every 5s when this tab is visible)
        </label>
        <button
          type="button"
          className="btn"
          style={{ fontSize: "0.85rem" }}
          onClick={() => {
            void dashboardQuery.refetch();
            void auditQuery.refetch();
          }}
          disabled={dashboardQuery.isFetching}
        >
          {dashboardQuery.isFetching ? "Refreshing…" : "Refresh now"}
        </button>
        {snap ? (
          <span style={{ color: "var(--admin-muted)", fontSize: "0.8rem" }}>
            Last snapshot: {new Date(snap.generatedAt).toLocaleString()}
          </span>
        ) : null}
      </div>

      {err ? <p className="err" style={{ marginTop: "1rem" }}>{err}</p> : null}

      {dashboardQuery.isLoading && !snap ? (
        <p style={{ marginTop: "1rem", color: "var(--admin-muted)" }}>Loading metrics…</p>
      ) : null}

      {snap ? (
        <>
          <SectionTitle>Accounts</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatCard label="Total users" value={snap.users.totalUsers} />
            <StatCard label="Active" value={snap.users.activeUsers} />
            <StatCard label="Pending" value={snap.users.pendingUsers} />
            <StatCard label="Suspended" value={snap.users.suspendedUsers} />
            <StatCard label="Deactivated" value={snap.users.deactivatedUsers} />
          </div>
          <SectionTitle>By role</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatCard label="Customers" value={snap.users.customers} />
            <StatCard label="Welpers" value={snap.users.welpers} />
            <StatCard label="Guardians" value={snap.users.guardians} />
          </div>
          <SectionTitle>Welper launch</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.75rem",
            }}
          >
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
          </div>
          <SectionTitle>Disputes</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatCard label="Open" value={snap.disputes.open} />
            <StatCard label="In review" value={snap.disputes.inReview} />
            <StatCard label="Escalated" value={snap.disputes.escalated} />
            <StatCard label="Resolved" value={snap.disputes.resolved} />
          </div>
          <SectionTitle>Support tickets</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatCard label="Open" value={snap.supportTickets.open} />
            <StatCard label="In progress" value={snap.supportTickets.inProgress} />
            <StatCard label="Closed" value={snap.supportTickets.closed} />
          </div>
          <SectionTitle>Bookings</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatCard label="Created (24h)" value={snap.bookings.createdLast24h} />
            <StatCard label="Currently disputed" value={snap.bookings.currentlyDisputed} />
          </div>
          <SectionTitle>Payments</SectionTitle>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "0.75rem",
            }}
          >
            <StatCard
              label="Captured total (7d)"
              value={formatMoney(snap.payments.capturedCentsLast7d, snap.payments.currency)}
            />
          </div>
        </>
      ) : null}

      <SectionTitle>Recent admin actions</SectionTitle>
      <div className="admin-card">
        {auditQuery.isLoading ? (
          <p style={{ color: "var(--admin-muted)", margin: 0 }}>Loading audit…</p>
        ) : auditQuery.error instanceof Error ? (
          <p className="err">{auditQuery.error.message}</p>
        ) : (
          <AuditTable rows={auditQuery.data?.data ?? []} />
        )}
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.85rem" }}>
          <Link href="/audit-logs">View all audit logs →</Link>
        </p>
      </div>
    </div>
  );
}
