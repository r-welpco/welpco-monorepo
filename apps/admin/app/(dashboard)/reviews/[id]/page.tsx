"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { listAdminReviews, deleteAdminReview, type AdminReview } from "@/lib/services/admin-reviews-service";

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [review, setReview] = useState<AdminReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    listAdminReviews({ page: 1, limit: 100 }).then((res) => {
      const found = res.items.find((r) => r.id === params.id);
      setReview(found ?? null);
    }).catch((e) => setError(e instanceof Error ? e.message : "Failed")).finally(() => setLoading(false));
  }, [params.id]);

  async function handleDelete() {
    if (!review || !confirm("Delete this review? This cannot be undone.")) return;
    setDeleting(true);
    try { await deleteAdminReview(review.id); router.push("/reviews"); }
    catch (e) { setError(e instanceof Error ? e.message : "Failed"); setDeleting(false); }
  }

  if (loading) return <p style={{ color: "var(--admin-muted)" }}>Loading...</p>;
  if (!review) return <div><p><Link href="/reviews">&larr; Reviews</Link></p><p className="err">Review not found.</p></div>;

  return (
    <div>
      <p><Link href="/reviews">&larr; Reviews</Link></p>
      <h1 style={{ marginTop: 0 }}>Review Detail</h1>
      <div className="admin-card">
        <table style={{ fontSize: "0.9rem" }}>
          <tbody>
            <tr><td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Rating</td><td>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)} ({review.rating}/5)</td></tr>
            <tr><td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Type</td><td><span className="badge">{review.reviewerType}</span></td></tr>
            <tr><td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Reviewer</td><td><Link href={`/users/${review.reviewerId}`}>{review.reviewerId}</Link></td></tr>
            <tr><td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Reviewee</td><td><Link href={`/users/${review.revieweeId}`}>{review.revieweeId}</Link></td></tr>
            <tr><td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Booking</td><td><Link href={`/bookings/${review.bookingId}`}>{review.bookingId}</Link></td></tr>
            <tr><td style={{ padding: "4px 12px 4px 0", color: "var(--admin-muted)" }}>Date</td><td>{new Date(review.createdAt).toLocaleString()}</td></tr>
          </tbody>
        </table>
        {review.comment ? (
          <div style={{ marginTop: "1rem", padding: "1rem", background: "var(--gray-2, #f5f5f5)", borderRadius: 6 }}>
            <strong>Comment:</strong>
            <p style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{review.comment}</p>
          </div>
        ) : <p style={{ color: "var(--admin-muted)", marginTop: "1rem" }}>No comment.</p>}
      </div>
      {error ? <p className="err">{error}</p> : null}
      <button type="button" className="btn" onClick={handleDelete} disabled={deleting} style={{ color: "var(--admin-danger, #e55)", marginTop: "1rem" }}>
        {deleting ? "Deleting..." : "Delete review"}
      </button>
    </div>
  );
}
