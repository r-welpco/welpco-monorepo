import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminSupportTicket } from "@/lib/services/admin-support-tickets-service";
import { SupportTicketForm } from "./ticket-form";

export const dynamic = "force-dynamic";

export default async function SupportTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let ticket;
  try {
    ticket = await getAdminSupportTicket(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        <Link href="/support-tickets">← Support tickets</Link>
      </p>
      <h1 style={{ marginBottom: "0.25rem" }}>{ticket.subject}</h1>
      <p style={{ color: "var(--admin-muted)" }}>
        <span className="badge">{ticket.status}</span> · <span className="badge">{ticket.priority}</span> ·{" "}
        category {ticket.category}
      </p>
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Requester</h2>
        <p style={{ margin: 0 }}>
          <Link href={`/users/${ticket.userId}`}>{ticket.userId}</Link>
        </p>
        {ticket.description ? (
          <p style={{ marginTop: "1rem", whiteSpace: "pre-wrap" }}>{ticket.description}</p>
        ) : null}
        <p style={{ fontSize: "0.85rem", color: "var(--admin-muted)", marginTop: "1rem" }}>
          Created {new Date(ticket.createdAt).toLocaleString()} · Updated {new Date(ticket.updatedAt).toLocaleString()}
        </p>
      </div>
      <SupportTicketForm key={`${ticket.updatedAt}-${ticket.status}`} ticket={ticket} />
    </div>
  );
}
