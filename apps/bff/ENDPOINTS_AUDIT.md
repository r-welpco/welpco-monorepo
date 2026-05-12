# BFF Endpoints Audit

This document compares the endpoints required by the frontend with what's available in the BFF. The BFF uses **in-process domain modules** (user-management, profile-management, etc.); there are no HTTP clients or microservice calls to separate services.

## Wave 2 — 2026-04-24 — Marketplace plumbing

Field additions + one new chat endpoint + one new dispute endpoint. Full breakdown in `apps/web/AUDIT-LOG.md` Day 7 Wave 2 section. Summary:

| Endpoint | Method | Change |
|---|---|---|
| `/api/bookings/:id/service-receipt` | GET / POST | Receipt response now carries `evidenceFiles: { id?, key, signedUrl: string \| null }[]` (always an array, presigned at response time, default 15-min TTL). |
| `/api/bookings/:id` | GET | The embedded `serviceReceipt` carries the same `evidenceFiles` block. |
| `/api/bookings/:bookingId/dispute` | GET | Each `file`-typed evidence item gains `signedUrl` (15-min TTL, nullable). |
| `/api/disputes` | GET | Same evidence enrichment per-item. |
| `/api/disputes/:id` | GET | Same evidence enrichment. |
| `/api/disputes/:id` | **DELETE (new)** | Filer-only withdraw. Marks the dispute `withdrawn` (soft-status). Restores the booking to `completed` if it was sitting in `disputed`. Emits `dispute.withdrawn` admin-audit row. |
| `/api/bookings/:bookingId/chat` | GET | Response now carries `lastReadAt: string \| null` for the requesting user only. |
| `/api/chat/inbox` | GET | Each item now carries `lastReadAt: string \| null` per the requesting user. |
| `/api/bookings/:bookingId/chat/read` | **POST (new)** | Marks the requesting user's `lastReadAt` to NOW(). Idempotent. Returns the updated `ChatThread`. |
| `/api/auth/reset-password` | POST | Wave 2: enumeration-safe. Always returns `200 { ok: true }` whether or not the email exists. Email send is fire-and-forget so timing is uniform. Rate-limit excess for known accounts is enforced silently (no thrown 400). |
| `/api/search/categories` | GET | Confirmed public (no JWT). Response shape extended with `displayOrder: number` (sort authority). Sorted server-side by `(displayOrder ASC, name ASC)`. Marketing landing now deep-links via `?categoryId=…` instead of `?q=<name>`. |

### S3 evidence presigning — env config

The new `S3UrlPresignerService` (in `apps/bff/src/clients/s3/`) reads:

- `S3_BUCKET_EVIDENCE` (preferred) or `AWS_S3_BUCKET` (fallback to the legacy uploads bucket).
- `S3_REGION` (preferred) or `AWS_S3_REGION` (fallback).
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for explicit creds in dev. Omit both in production to use IRSA / instance-role creds.
- `S3_PRESIGN_TTL_SECONDS` (default `900`).

When the bucket/region isn't configured the service stays in degraded mode and `signedUrl` resolves to `null` — local dev (no AWS creds) and tests run without failing every receipt/dispute read.

### Migrations

- `apps/bff/src/domains/booking/migrations/20260424000010-AddBookingServiceReceiptEvidenceFiles.ts` — adds `evidence_files` JSONB column (nullable).
- `apps/bff/src/domains/communication/migrations/20260424000020-AddChatThreadLastReadAt.ts` — adds `last_read_at_customer` + `last_read_at_welper` timestamptz columns (both nullable; default NULL = "never read").

No DB enum migration for the dispute `withdrawn` status — the column is `varchar(32)` so the value set extends without a schema change.

## Wave 1 — 2026-04-24 — Welper trust signals on the public profile

**No new endpoints.** Wave 1 was field additions on existing endpoints + one schema redesign. See `apps/web/AUDIT-LOG.md` "Day 7" entry for the full breakdown. Summary:

- `GET /api/search/welpers/:welperId` (public) — now also returns `verified: boolean`, `averageRating: number | null`, `reviewCount: number`, `responseTimeMinutes: number | null`, and `serviceAreaInfo: { city, province, country, postalCodes[] } | null`.
- `GET /api/profiles/me` (welper) — same five fields surfaced on the welper's own profile read, so the welper dashboard can mirror what customers see.
- `PUT /api/profiles/me` (welper) — accepts new `serviceAreaCity` (string) and `serviceAreaPostalCodes` (string[], 1–10 alphanumeric chars each, max 50) on the request body. Returns the same hydrated shape.
- DTOs aligned: `WelperProfileResponseDto` (internal) and `PublicWelperProfileDto` (public) now both expose the same Wave 1 fields.

Aggregations (`averageRating`, `reviewCount`, `responseTimeMinutes`) are computed on demand by `WelperProfileAggregatesService` — no denormalized counter caching shipped this wave (see follow-up #2 in AUDIT-LOG.md). `verified` defaults to `false` on existing rows; flipping it requires the (deferred) KYC workflow.

## ✅ Auth Endpoints (All Present)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/auth/login` | POST | ✅ | Working |
| `/api/auth/register` | POST | ✅ | Working |
| `/api/auth/verify-email` | POST | ✅ | Working |
| `/api/auth/resend-verification-email` | POST | ✅ | Working |
| `/api/auth/refresh` | POST | ✅ | Working (just added) |
| `/api/auth/reset-password` | POST | ✅ | Working |
| `/api/auth/reset-password/confirm` | POST | ✅ | Working |
| `/api/auth/change-password` | POST | ✅ | Working |

## ✅ User Endpoints (All Present)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/users/me` | GET | ✅ | Working |

## ⚠️ Profile Endpoints (Partially Implemented)

### ✅ Implemented

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/profiles/me` | GET | ✅ | Working |
| `/api/profiles/me` | PUT | ✅ | Working |
| `/api/profiles/me/onboarding-complete` | PUT | ✅ | Working |
| `/api/profiles/me/services` | GET | ✅ | Working |
| `/api/profiles/me/services` | POST | ✅ | Working |
| `/api/profiles/me/services/:id` | PUT | ✅ | Working |
| `/api/profiles/me/services/:id` | DELETE | ✅ | Working |
| `/api/profiles/me/favorites` | GET | ✅ | Working (added in profile wire+align) |
| `/api/profiles/me/favorites` | POST | ✅ | Working |
| `/api/profiles/me/favorites/:id` | DELETE | ✅ | Working (id = favorite row ID or welper ID) |
| `/api/profiles/me/availability` | GET | ✅ | Working |
| `/api/profiles/me/availability` | PUT | ✅ | Working |
| `/api/profiles/me/availability/exceptions` | GET | ✅ | Working (optional ?calendarId=); returns endDate for ranges |
| `/api/profiles/me/availability/exceptions` | POST | ✅ | Working (body may include optional endDate for date range) |
| `/api/profiles/me/availability/exceptions/:id` | DELETE | ✅ | Working |
| `/api/profiles/welper/:id` | GET | ✅ | Working (public endpoint) |

### Content (reference data)

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/api/content/holidays` | GET | ✅ | Working (countryCode required; provinceCode, from, to optional) |

### ❌ Missing Endpoints

| Endpoint | Method | Frontend Usage | Priority |
|----------|--------|----------------|----------|
| `/api/profiles/me/preferences` | GET | `getServicePreferences()` | Medium |
| `/api/profiles/me/preferences` | PUT | `updateServicePreferences()` | Medium |

### ✅ Endpoint Mismatch Resolved

| Frontend | BFF | Resolution |
|----------|-----|------------|
| `DELETE /api/profiles/me/favorites/:favoriteId` | `DELETE /api/profiles/me/favorites/:id` | BFF accepts favorite row ID or welper ID; tries by favorite id first, then by welper id. |

## Summary

- **Auth Endpoints**: ✅ 8/8 (100%) - All implemented
- **User Endpoints**: ✅ 1/1 (100%) - All implemented
- **Profile Endpoints**: ⚠️ 19/21 (90%) - 2 endpoints missing (preferences)

## Backend Service Status

### Profile-Management Service Endpoints Available:
- ✅ Service Offerings: GET, POST, PUT, DELETE (all available)
- ✅ Availability: GET, PUT (available)
- ✅ Availability Exceptions: GET, POST, DELETE (implemented in BFF using profile-management entities)
- ❌ Service Preferences: Not implemented in profile-management

## Recommendations

### High Priority (Required for Core Functionality)
1. ~~**Availability Management**~~ ✅ GET/PUT `/api/profiles/me/availability` implemented in BFF
2. ~~**Fix Favorites DELETE**~~ ✅ Resolved: BFF accepts favoriteId or welperId

### Medium Priority (Nice to Have)
3. ~~**Availability Exceptions**~~ ✅ GET/POST/DELETE `/api/profiles/me/availability/exceptions` implemented in BFF
   - Frontend expects these endpoints but they don't exist in backend
   - **Decision needed**: Implement in profile-management or remove from frontend

4. **Service Preferences**: Not implemented in profile-management service
   - Frontend expects these endpoints but they don't exist in backend
   - **Decision needed**: Implement in profile-management or remove from frontend

## Next Steps

1. ✅ **Verified**: Profile-management service has service offerings and availability endpoints
2. ✅ **Service Offerings CRUD**: POST, PUT, DELETE `/api/profiles/me/services` (and GET) are implemented in BFF
3. ✅ **Favorites DELETE**: BFF accepts favoriteId or welperId
4. **Decide on availability exceptions and preferences** - implement or remove from frontend
5. **Test all endpoints** end-to-end
