import { apiClient, ApiClientError } from "@/lib/api/client";

/**
 * SHARE-004 — Share hub data access.
 *
 * The sharing endpoints live under `profiles/me` on the BFF (welper-only):
 * - `GET  /api/profiles/me`                → hydrated welper profile (has `handle`)
 * - `POST /api/profiles/me/handle`         → set-once vanity handle claim
 * - `GET  /api/profiles/me/profile-views`  → view totals by src (SHARE-005)
 *
 * Note: for welpers `user.id` (JWT userId) *is* the public `welperId` used by
 * `/welper/{id}` and `/api/search/welpers/:id` — no extra lookup needed.
 */

export interface ShareProfileInfo {
  welperId: string;
  /** Vanity handle; null until claimed (set-once). */
  handle: string | null;
}

export interface ProfileViewStats {
  total: number;
  last30DaysTotal: number;
  totalsBySrc: { src: string; count: number }[];
}

/** Handle claim failures the form turns into specific inline errors (§16.2). */
export type ClaimHandleErrorCode =
  | "INVALID_HANDLE"
  | "HANDLE_RESERVED"
  | "HANDLE_ALREADY_SET"
  | "HANDLE_TAKEN"
  | "UNKNOWN";

export class ClaimHandleError extends Error {
  constructor(
    public claimCode: ClaimHandleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ClaimHandleError";
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** Minimal share info from the hydrated `/api/profiles/me` welper payload. */
export async function getShareProfileInfo(): Promise<ShareProfileInfo | null> {
  const response = await apiClient.get<unknown>("/api/profiles/me");
  if (!isRecord(response)) return null;
  const welperId =
    typeof response.welperId === "string"
      ? response.welperId
      : typeof response.userId === "string"
        ? response.userId
        : null;
  if (!welperId) return null;
  return {
    welperId,
    handle: typeof response.handle === "string" && response.handle ? response.handle : null,
  };
}

const CLAIM_CODES: readonly ClaimHandleErrorCode[] = [
  "INVALID_HANDLE",
  "HANDLE_RESERVED",
  "HANDLE_ALREADY_SET",
  "HANDLE_TAKEN",
];

/** `POST /api/profiles/me/handle` — set-once; throws `ClaimHandleError` with the BFF code. */
export async function claimHandle(handle: string): Promise<{ handle: string }> {
  try {
    const response = await apiClient.post<unknown>("/api/profiles/me/handle", { handle });
    if (isRecord(response) && typeof response.handle === "string") {
      return { handle: response.handle };
    }
    // 201 without a JSON body — the claim succeeded; echo the input.
    return { handle };
  } catch (error) {
    if (error instanceof ApiClientError) {
      const bodyCode =
        isRecord(error.body) && typeof error.body.code === "string"
          ? error.body.code
          : error.code;
      const code = CLAIM_CODES.find((c) => c === bodyCode) ?? "UNKNOWN";
      throw new ClaimHandleError(code, error.message);
    }
    throw error;
  }
}

/** `GET /api/profiles/me/profile-views` — SHARE-005 totals. */
export async function getProfileViewStats(): Promise<ProfileViewStats> {
  const response = await apiClient.get<unknown>("/api/profiles/me/profile-views");
  if (!isRecord(response)) {
    return { total: 0, last30DaysTotal: 0, totalsBySrc: [] };
  }
  const totalsBySrc = Array.isArray(response.totalsBySrc)
    ? response.totalsBySrc.filter(
        (row): row is { src: string; count: number } =>
          isRecord(row) && typeof row.src === "string" && typeof row.count === "number",
      )
    : [];
  return {
    total: typeof response.total === "number" ? response.total : 0,
    last30DaysTotal:
      typeof response.last30DaysTotal === "number" ? response.last30DaysTotal : 0,
    totalsBySrc,
  };
}
