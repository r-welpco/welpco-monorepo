/**
 * Wave 2 (BFF): a single S3-backed evidence file as returned to the client.
 *
 * Used by both `BookingServiceReceipt.evidenceFiles` and `Dispute.evidence`
 * (the latter only when `type === 'file'`). The `signedUrl` is presigned at
 * response time with a short TTL (default 15 minutes) — never persisted, never
 * cached client-side past its expiry.
 *
 * `signedUrl` is `null` when:
 *   - the BFF's S3 presigner isn't configured (local dev without AWS creds)
 *   - signing failed transiently (network error to AWS)
 *
 * Clients should treat `null` as "metadata only, no download URL right now"
 * and surface filename/icon affordances even without the link.
 */
export interface EvidenceFile {
  /** Optional client-supplied id used for stable React keys + diffing. */
  id?: string;
  /** Raw S3 object key. Do not expose to end users — use `signedUrl`. */
  key: string;
  /** Short-lived presigned GET URL (default 15 min TTL). */
  signedUrl: string | null;
}
