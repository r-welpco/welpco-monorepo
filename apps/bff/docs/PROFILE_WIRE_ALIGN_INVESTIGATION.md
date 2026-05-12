# Profile Wire + Align – Investigation Summary

## 1. Request flow (already correct)

- **Web** `apiClient` uses `NEXT_PUBLIC_API_URL` (default `http://localhost:3000`) and calls `PUT /api/profiles/me`, `GET /api/profiles/me`, etc.
- **BFF** has global prefix `api` (`main.ts`), so routes are `GET/PUT /api/profiles/me`.
- **BFF** `ProfilesController` → `ProfilesService` → domain `CustomerProfileService` / `WelperProfileService` for get/update.
- **Seed** creates `e2e-customer@welpco.com` and a **customer profile** with `customerId: user.id`, and sets `onboardingCompleted: true`.

So the wire (web → BFF → domain) is in place. PUT /api/profiles/me exists and is implemented.

## 2. Why E2E can get 404 on profile update

- **404** from BFF = `NotFoundException('Customer profile not found')` from `CustomerProfileService.findByCustomerId(customerId)` when no row exists for that `customerId`.
- Causes: (1) **Seed not run** for the E2E DB so no customer profile; (2) **JWT `userId` ≠ seeded user id** (e.g. different DB or user); (3) **Request not hitting BFF** (e.g. `NEXT_PUBLIC_API_URL` pointing at Next.js) → Next.js returns 404 for unknown route.

**Checks:**

- E2E / dev: ensure **BFF is running** and web `NEXT_PUBLIC_API_URL` points to BFF (e.g. `http://localhost:3000`). `.env` has it; `.env.test.local` does not set it (Playwright loads that for test process only; the dev server uses `.env`/`.env.local`).
- Run **seed** before E2E: `pnpm seed:users` (or equivalent) so `e2e-customer@welpco.com` has a customer profile.

## 3. What’s implemented vs missing

### BFF ProfilesController (modules/profiles)

| Endpoint                     | Method | Status  | Notes |
|-----------------------------|--------|---------|--------|
| `/api/profiles/me`          | GET    | ✅      | Working |
| `/api/profiles/me`          | PUT    | ✅      | Working; body not validated with DTO |
| `/api/profiles/me/onboarding-complete` | PUT | ✅ | Working |
| `/api/profiles/me/services` | GET, POST | ✅ | Working |
| `/api/profiles/me/services/:serviceId` | PUT, DELETE | ✅ | Working |
| `/api/profiles/me/favorites` | GET   | ❌ **Missing** | Web calls it for list favorites |
| `/api/profiles/me/favorites` | POST  | ✅      | Working |
| `/api/profiles/me/favorites/:welperId` | DELETE | ✅ | Param is welperId; frontend sends favoriteId |
| `/api/profiles/welper/:id`  | GET    | ✅      | Working |
| `/api/profiles/me/preferences` | GET, PUT | ❌ | Not in BFF or profile-management domain |
| `/api/profiles/me/availability` | GET, PUT | ❌ | Not in BFF controller (domain has it) |

### Domain vs BFF

- **CustomerProfileService.update** expects `UpdateCustomerProfileDto` (firstName, lastName, phoneNumber, address). BFF passes raw body; no ValidationPipe on that route → invalid body can cause 500 or unexpected behavior. Prefer validating with DTO in BFF.
- **FavoriteService**: has `findByCustomerId`, `create`, `remove(customerId, welperId, userId)`. No `removeByFavoriteId`; BFF only supports delete by welperId. Frontend uses favoriteId → **align by supporting delete by favorite id** (look up by id + customerId, then remove).

## 4. Alignments to do

1. **Add GET /api/profiles/me/favorites** in BFF (controller + service calling `favoriteService.findByCustomerId`).
2. **DELETE favorites**: support **favoriteId** so frontend can keep calling `DELETE /api/profiles/me/favorites/:favoriteId`. Options: (A) Add `FavoriteService.removeByFavoriteId(customerId, favoriteId, userId)` and new route or (B) Interpret param as favoriteId when it matches a favorite row id for current customer, else treat as welperId. Prefer (A) for clarity.
3. **PUT /api/profiles/me**: validate body with `UpdateCustomerProfileDto` (or a BFF-specific DTO that maps from web shape) so bad payloads return 400 instead of 500.
4. **E2E / env**: Document that BFF must be running and `NEXT_PUBLIC_API_URL` must point to BFF; add `NEXT_PUBLIC_API_URL` to `.env.test.example` so E2E runs with correct API base.
5. **Preferences**: GET/PUT `/api/profiles/me/preferences` are not implemented in BFF or profile-management domain. Leave as future work; web already handles 404 (e.g. null/fallback).

## 5. Not in scope for this pass

- **Availability** (GET/PUT `/api/profiles/me/availability`): domain has it; BFF controller doesn’t expose it yet. Defer.
- **Service preferences** in domain: not implemented; defer.
- **Availability exceptions**: not implemented; defer.

## 6. Files touched (implementation)

- BFF: `modules/profiles/profiles.controller.ts` (GET me/favorites; DELETE me/favorites by favoriteId).
- BFF: `modules/profiles/profiles.service.ts` (getFavoriteWelpers; removeFavoriteByFavoriteId or equivalent).
- BFF: `domains/profile-management/favorite/favorite.service.ts` (removeByFavoriteId if we add it).
- BFF: `modules/profiles/profiles.controller.ts` (PUT me: use DTO for validation).
- Web: `.env.test.example` (add `NEXT_PUBLIC_API_URL`).
- Docs: `ENDPOINTS_AUDIT.md` (update after changes).
