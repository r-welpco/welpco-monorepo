# Geocode Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/geocode/`

## Purpose
Thin geocoding proxy over the Google Maps Geocoding API: forward (address → coordinates) and reverse (coordinates → address), with an in-memory LRU cache and rate limiter. Also provides the injectable `GEOCODE_SERVICE` used by other domains.

## Entities
None — stateless, no database tables.

## Services

- `GoogleMapsGeocodeService` (`google-maps-geocode.service.ts`) — implements `IGeocodeService` (`geocode.interface.ts`); calls `https://maps.googleapis.com/maps/api/geocode/json` with `GOOGLE_MAPS_API_KEY`; includes an internal `LruCache`; logs a warning at startup if the key is missing. Provider is swappable by binding a different implementation to the `GEOCODE_SERVICE` token (`geocode.module.ts`).
- `RateLimiterService` (`rate-limiter.service.ts`) — in-memory, single-instance limiter: minimum 100 ms between requests (~10 QPS) and max 10 concurrent; file documents a Redis-based production TODO.

## API endpoints (prefix `api`)

Both routes are explicitly `@Public()` (`geocode.controller.ts`).

| Method | Path | Query DTO |
|---|---|---|
| GET | /api/geocode/forward | `dto/forward-query.dto.ts` (address search) |
| GET | /api/geocode/reverse | `dto/reverse-query.dto.ts` (lat/lng) |

## Scheduled jobs
None.

## External integrations
Google Maps Geocoding API (`GOOGLE_MAPS_API_KEY`). No other providers (a previous Nominatim usage is referenced only in comments).

## Cross-domain dependencies
Depends on nothing. Exported `GEOCODE_SERVICE`/`GoogleMapsGeocodeService` are consumed by service-discovery and job-posting.

## Key files
- `geocode.module.ts`, `geocode.interface.ts`
- `geocode.controller.ts`
- `google-maps-geocode.service.ts`
- `rate-limiter.service.ts`
