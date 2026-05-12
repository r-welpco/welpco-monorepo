/**
 * Wave 2 (BFF): a single dispute evidence item as returned to the client.
 *
 * Two flavours:
 *  - `type: 'file'`: a participant-uploaded artifact (photo, scan). Carries an
 *    S3 `key` and a Wave-2 presigned `signedUrl` (default 15 min TTL,
 *    nullable when the presigner is misconfigured).
 *  - `type: 'message'`: a reference to an in-thread chat message
 *    (`id` = message id). No `signedUrl` because there's nothing to download.
 */
export interface DisputeEvidenceItem {
    type: 'file' | 'message';
    /** S3 object key when `type === 'file'`. */
    key?: string;
    /** Message id when `type === 'message'`. */
    id?: string;
    /**
     * Wave 2: short-lived presigned GET URL for `type === 'file'` items.
     * Always omitted (or `null`) for `type === 'message'`.
     */
    signedUrl?: string | null;
}
//# sourceMappingURL=dispute-evidence.type.d.ts.map