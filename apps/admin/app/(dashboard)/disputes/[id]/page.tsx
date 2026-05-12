import Link from "next/link";
import { notFound } from "next/navigation";
import { getDisputeById, type DisputeItem, type DisputeParticipantSummary } from "@/lib/services/dispute-service";
import { ResolutionForm } from "./resolution-form";

export const dynamic = "force-dynamic";

export default async function DisputeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let dispute: DisputeItem;
  try {
    dispute = await getDisputeById(id);
  } catch {
    notFound();
  }

  const canResolve = dispute.status !== "resolved";

  function partyBlock(title: string, p: DisputeParticipantSummary | undefined, userLinkPrefix: string) {
    if (!p) return null;
    const name = [p.firstName, p.lastName].filter(Boolean).join(" ") || "—";
    return (
      <div className="admin-card" style={{ marginTop: "1rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>{title}</h2>
        <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
          <li>
            <strong>Name:</strong> {name}
          </li>
          <li>
            <strong>User ID:</strong>{" "}
            <Link href={`${userLinkPrefix}/${p.userId}`} style={{ fontFamily: "ui-monospace, monospace" }}>
              {p.userId}
            </Link>
          </li>
          {p.email ? (
            <li>
              <strong>Email:</strong>{" "}
              <a href={`mailto:${p.email}`}>{p.email}</a>
            </li>
          ) : (
            <li>
              <strong>Email:</strong> — (not on account)
            </li>
          )}
          <li>
            <strong>Phone:</strong> {p.phoneDisplay ?? "—"}
          </li>
        </ul>
      </div>
    );
  }

  return (
    <div>
      <p style={{ marginTop: 0 }}>
        <Link href="/disputes">← Disputes</Link>
      </p>
      <h1 style={{ marginBottom: "0.25rem" }}>{dispute.subject}</h1>
      <p style={{ color: "var(--admin-muted)" }}>
        <span className="badge">{dispute.status}</span> · Booking{" "}
        <Link href={`/bookings/${dispute.bookingId}`} style={{ fontFamily: "ui-monospace, monospace" }}>
          {dispute.bookingId}
        </Link>
        {dispute.bookingStatus ? (
          <>
            {" "}
            · booking <span className="badge">{dispute.bookingStatus}</span>
          </>
        ) : null}
      </p>
      {dispute.bookingCancelledWithOpenDispute ? (
        <div className="admin-callout" role="status">
          <strong>Cancelled while disputed.</strong> This booking was cancelled before the dispute was closed
          (legacy or edge case). The booking stays <code>cancelled</code>; record a resolution to close the dispute.
          Participants can no longer cancel while a dispute is open.
        </div>
      ) : null}
      {dispute.capturedPayment ? (
        <div className="admin-callout" role="status" style={{ marginTop: "1rem" }}>
          <strong>Captured payments.</strong> Total charged on file:{" "}
          <code>
            {(dispute.capturedPayment.totalCents / 100).toFixed(2)} {dispute.capturedPayment.currency.toUpperCase()}
          </code>
          . Partial refunds apply to the latest capture first, then earlier captures, up to this total.
        </div>
      ) : null}

      {partyBlock("Customer", dispute.customer, "/users")}
      {partyBlock("Welper", dispute.welper, "/users")}

      <div className="admin-card" style={{ marginTop: "1.25rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Dispute details</h2>
        <p>
          <strong>Category:</strong> {dispute.category}
        </p>
        <p>
          <strong>Filer:</strong> {dispute.filerType} ·{" "}
          <Link href={`/users/${dispute.filerId}`} style={{ fontFamily: "ui-monospace, monospace" }}>
            {dispute.filerId}
          </Link>
        </p>
        {dispute.description ? (
          <p style={{ whiteSpace: "pre-wrap" }}>
            <strong>Description</strong>
            <br />
            {dispute.description}
          </p>
        ) : null}
        <p style={{ fontSize: "0.85rem", color: "var(--admin-muted)" }}>
          Created {new Date(dispute.createdAt).toLocaleString()} · Updated{" "}
          {new Date(dispute.updatedAt).toLocaleString()}
        </p>
      </div>

      {dispute.resolution ? (
        <div className="admin-card" style={{ marginTop: "1.25rem" }}>
          <h2 style={{ marginTop: 0, fontSize: "1rem" }}>Resolution on file</h2>
          <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.9rem" }}>
            <li>
              <strong>Type:</strong> {dispute.resolution.resolutionType.replace(/_/g, " ")}
            </li>
            <li>
              <strong>Resolved at:</strong> {new Date(dispute.resolution.resolvedAt).toLocaleString()}
            </li>
            {dispute.resolution.resolvedById ? (
              <li>
                <strong>Resolved by:</strong>{" "}
                <Link
                  href={`/users/${dispute.resolution.resolvedById}`}
                  style={{ fontFamily: "ui-monospace, monospace" }}
                >
                  {dispute.resolution.resolvedById}
                </Link>
              </li>
            ) : null}
            {dispute.resolution.refundAmount != null ? (
              <li>
                <strong>Refund amount (recorded):</strong> {dispute.resolution.refundAmount}
              </li>
            ) : null}
            {dispute.resolution.notes ? (
              <li style={{ whiteSpace: "pre-wrap" }}>
                <strong>Notes:</strong> {dispute.resolution.notes}
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {canResolve ? (
        <ResolutionForm disputeId={dispute.id} dispute={dispute} />
      ) : (
        <p className="ok" style={{ marginTop: "1rem" }}>
          This dispute is already resolved.
        </p>
      )}
    </div>
  );
}
