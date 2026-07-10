# Service Discovery Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/service-discovery/`

## Purpose
Public marketplace search: finds discoverable welpers by category/subcategory, location and filters, lists searchable categories, and serves public welper profiles. Read-only — it owns no database tables of its own.

## Entities
None owned. Queries `WelperProfile` and `ServiceOffering` (profile-management) and `UserAccount` (user-management) via injected repositories (`service-discovery.module.ts`).

## Services

- `ServiceDiscoveryService` (`service-discovery.service.ts`) — `searchServices` (query builder over welper profiles + offerings, geocoded location filtering, category resolution, cached category tree via `DiscoveryCategoriesCacheService` from `common/discovery-categories-cache`), `getCategories`, `getPublicWelperProfile`.
- `welper-marketplace-eligibility.util.ts` — `isWelperAccountMarketplaceEligible` / `applyMarketplaceAccountFilters`: welper is discoverable only if accountType=Welper, status=Active, signupCompleted, emailVerified (mirrors the admin "discoverable" definition). Background-check visibility is additionally enforced through `BackgroundCheckService.assertVisibleInSearch`.

## API endpoints (prefix `api`)

All three routes are **unauthenticated** (no guards on `service-discovery.controller.ts`).

| Method | Path | Auth |
|---|---|---|
| GET | /api/search/services | Public |
| GET | /api/search/categories | Public |
| GET | /api/search/welpers/:welperId | Public |

## Scheduled jobs
None.

## External integrations
Google Maps geocoding, indirectly via the injected `GEOCODE_SERVICE` (geocode domain) for forward-geocoding search locations.

## Cross-domain dependencies
Imports `ProfileManagementDomainModule` (WelperProfileService, aggregates, offerings, availability), `ContentManagementDomainModule` (CategoriesService), `GeocodeModule`, `SafetyVerificationModule` (BackgroundCheckService), plus entities from user-management and profile-management.

## Key files
- `service-discovery.module.ts`
- `service-discovery.controller.ts`
- `service-discovery.service.ts`
- `welper-marketplace-eligibility.util.ts`
- `dto/search-services-query.dto.ts`, `dto/public-welper-profile.dto.ts`
