"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { listAdminUsers } from "@/lib/services/admin-users-service";
import {
  patchAdminSupportTicket,
  type SupportTicketItem,
  type SupportTicketAdminPriority,
  type SupportTicketAdminStatus,
} from "@/lib/services/admin-support-tickets-service";

const STATUSES: SupportTicketAdminStatus[] = ["open", "in_progress", "resolved", "closed"];
const PRIORITIES: SupportTicketAdminPriority[] = ["low", "medium", "high"];

function statusOptions(current: string): string[] {
  const set = new Set<string>([...STATUSES, current]);
  return [...set];
}

function priorityOptions(current: string): string[] {
  const set = new Set<string>([...PRIORITIES, current]);
  return [...set];
}

export function SupportTicketForm({ ticket }: { ticket: SupportTicketItem }) {
  const router = useRouter();
  const [status, setStatus] = useState(ticket.status);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignee, setAssignee] = useState(ticket.assignedToUserId ?? "");
  const [internalNote, setInternalNote] = useState(ticket.internalNote ?? "");
  const [adminOptions, setAdminOptions] = useState<{ id: string; email: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listAdminUsers({ accountType: "Admin", limit: 100, offset: 0 })
      .then((res) => {
        if (!cancelled) {
          setAdminOptions(res.users.map((u) => ({ id: u.id, email: u.email })));
        }
      })
      .catch(() => {
        /* dropdown optional */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setStatus(ticket.status);
    setPriority(ticket.priority);
    setAssignee(ticket.assignedToUserId ?? "");
    setInternalNote(ticket.internalNote ?? "");
  }, [ticket]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(null);
    setLoading(true);
    try {
      const body: Parameters<typeof patchAdminSupportTicket>[1] = {
        internalNote: internalNote.trim() || null,
      };
      if (STATUSES.includes(status as SupportTicketAdminStatus)) {
        body.status = status as SupportTicketAdminStatus;
      }
      if (PRIORITIES.includes(priority as SupportTicketAdminPriority)) {
        body.priority = priority as SupportTicketAdminPriority;
      }
      body.assignedToUserId = assignee.trim() === "" ? null : assignee.trim();
      await patchAdminSupportTicket(ticket.id, body);
      setOk("Saved.");
      router.refresh();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="admin-card" style={{ marginTop: "1rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Triage</h2>
      <div style={{ display: "grid", gap: "0.75rem", maxWidth: 480 }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Status
          <select
            className="admin-input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status"
          >
            {statusOptions(ticket.status).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Priority
          <select
            className="admin-input"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            aria-label="Priority"
          >
            {priorityOptions(ticket.priority).map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Assigned admin (UUID — pick or clear)
          <input
            className="admin-input"
            list="admin-assignees"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Empty = unassigned"
          />
          <datalist id="admin-assignees">
            {adminOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.email}
              </option>
            ))}
          </datalist>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.85rem" }}>
          Internal note
          <textarea
            className="admin-input"
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            rows={4}
          />
        </label>
      </div>
      {err ? <p className="err">{err}</p> : null}
      {ok ? <p className="ok">{ok}</p> : null}
      <button type="submit" className="btn btn-primary" style={{ marginTop: "0.75rem" }} disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
