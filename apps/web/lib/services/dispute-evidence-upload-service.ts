import { apiClient } from "@/lib/api/client";

/**
 * DISPUTES-001 (Day 16): two-step direct-to-S3 upload for dispute evidence.
 *
 * 1. Ask the BFF for a presigned PUT URL (auth-gated, content-type and size
 *    whitelist-enforced server-side).
 * 2. PUT the file bytes directly to S3 (no proxy through the BFF).
 *
 * The returned `key` is what the FE submits as `evidence[].key` on dispute
 * create. `signedUrl` for download is generated server-side at read-time
 * (`DisputeService.signEvidence`) — never persisted.
 *
 * Mirrors the existing `uploads` pattern (profile photos via
 * `apps/bff/src/modules/uploads/uploads.service.ts`); the difference is the
 * S3 key namespace and the dispute-specific content-type whitelist.
 */

interface PresignResponse {
  uploadUrl: string;
  key: string;
  contentType: string;
  ttlSeconds: number;
}

/** Whitelist mirrors `DISPUTE_EVIDENCE_ALLOWED_CONTENT_TYPES` on the BFF. */
const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const;

type AllowedContentType = (typeof ALLOWED_CONTENT_TYPES)[number];

function normaliseContentType(file: File): AllowedContentType {
  // Some browsers report `image/jpg` instead of `image/jpeg`; normalise.
  const t = file.type === "image/jpg" ? "image/jpeg" : file.type;
  if (!ALLOWED_CONTENT_TYPES.includes(t as AllowedContentType)) {
    throw new Error(
      `Unsupported file type "${file.type || "unknown"}". We accept JPG, PNG, WEBP, HEIC, or PDF.`,
    );
  }
  return t as AllowedContentType;
}

/**
 * Uploads a single file. Resolves with the resulting S3 `key`. Throws with a
 * user-friendly message on rejection — `<EvidenceUpload>` surfaces the
 * message inline on the failed row.
 */
export async function uploadDisputeEvidence(file: File): Promise<{ key: string }> {
  const contentType = normaliseContentType(file);

  const presign = await apiClient.post<PresignResponse>(
    "/api/disputes/evidence/presign",
    {
      fileName: file.name,
      contentType,
      sizeBytes: file.size,
    },
  );

  const putRes = await fetch(presign.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!putRes.ok) {
    throw new Error(
      `Upload failed (${putRes.status}). Please try again.`,
    );
  }

  return { key: presign.key };
}
