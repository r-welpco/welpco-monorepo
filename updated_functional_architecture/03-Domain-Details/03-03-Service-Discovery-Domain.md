# Service Discovery & Search Domain

> **Status**: Implemented
> **Classification**: Core
> **Priority**: Critical
> **Module**: `domains/service-discovery/`

## Purpose

Enables customers to discover, search, filter, and browse available services and Welpers. Combines PostgreSQL full-text search with trigram similarity, location-based filtering via `earth_distance`, category/subcategory filtering, price and rating ranges, and multiple sort options. Also provides geocoding endpoints for address resolution.

## Core Capabilities

### 1. Full-Text Search

- PostgreSQL `tsvector` / `tsquery` with `to_tsvector('english', ...)` on Welper bio, service description, and category names
- `pg_trgm` extension for fuzzy/typo-tolerant matching (trigram similarity)
- `unaccent` extension for accent-insensitive search
- Combined relevance score: `ts_rank` + trigram similarity weight

### 2. Location-Based Filtering

- Input: latitude, longitude, radius (km)
- Implementation: PostgreSQL `earth_distance` extension with `earth_box` for bounding-box pre-filter, then `earth_distance()` for precise distance calculation
- Distance is returned in the response for each result
- Defaults to the customer's profile address if no explicit location is provided

### 3. Category & Subcategory Filtering

- Filter by `categoryId` (main category) and/or `subcategoryId`
- Categories are sourced from the Content Management domain
- Supports browsing by category without search text

### 4. Price Range Filtering

- Filter by `minPrice` and/or `maxPrice`
- Applied against `ServiceOffering.hourlyRate`

### 5. Rating Filtering

- Filter by `minRating` (e.g., 4+ stars)
- Applied against the Welper's aggregated average rating (future: from Review & Rating domain; currently defaults to null)

### 6. Sort Options

- `relevance` (default): combined text relevance + trigram similarity
- `price_asc` / `price_desc`: by hourly rate
- `distance_asc`: by distance from search location
- `rating_desc`: by average rating (highest first)

### 7. Geocoding

- **Forward geocoding**: postal code or address string → `{ lat, lng, formattedAddress }`
- **Reverse geocoding**: `{ lat, lng }` → `{ streetAddress, city, province, postalCode, country }`
- **Provider**: Google Maps Geocoding API
- **Abstraction**: `IGeocodeService` interface — swap to Mapbox or another provider by implementing the interface and rebinding the DI token
- **Caching**: LRU in-memory cache (configurable TTL and max size) to minimize API calls
- **Rate limiting**: token-bucket limiter to stay within Google Maps quotas

## Data Entities

This domain does not own persistent entities. It reads from Profile Management and Content Management via in-process service calls and constructs search results on the fly.

### Search Result Shape (returned to client)

```typescript
interface SearchResult {
  welperProfileId: string;
  firstName: string;
  lastName: string;
  profilePhotoUrl: string | null;
  bio: string;
  serviceOffering: {
    id: string;
    categoryId: string;
    categoryName: string;
    subcategoryName: string | null;
    description: string;
    hourlyRate: number;
    experienceYears: number;
  };
  distanceKm: number | null;       // null if no location filter
  averageRating: number | null;     // null until Review domain is live
  totalReviews: number;
  relevanceScore: number;           // internal ranking score
}
```

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
```

## API Endpoints

All prefixed with `/api`.

### Search

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/search/services` | Public | Search and filter services. Query params below. |
| `GET` | `/search/categories` | Public | List all active categories with subcategories (for browse UI). |
| `GET` | `/search/welpers/:id` | Public | Get a single Welper's full public profile with offerings and availability. |

#### `GET /search/services` Query Parameters

| Param | Type | Required | Description |
|---|---|---|---|
| `q` | `string` | No | Free-text search query |
| `categoryId` | `uuid` | No | Filter by category |
| `subcategoryId` | `uuid` | No | Filter by subcategory |
| `lat` | `number` | No | Latitude for location search |
| `lng` | `number` | No | Longitude for location search |
| `radiusKm` | `number` | No | Search radius (default: 25km) |
| `minPrice` | `number` | No | Minimum hourly rate |
| `maxPrice` | `number` | No | Maximum hourly rate |
| `minRating` | `number` | No | Minimum average rating (1-5) |
| `sort` | `string` | No | `relevance`, `price_asc`, `price_desc`, `distance_asc`, `rating_desc` |
| `page` | `number` | No | Page number (default: 1) |
| `limit` | `number` | No | Results per page (default: 20, max: 50) |

At least one of `q`, `categoryId`, or `lat`+`lng` is required.

### Geocoding

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/geocode/forward` | Bearer | Forward geocode. Query: `address` (string). |
| `GET` | `/geocode/reverse` | Bearer | Reverse geocode. Query: `lat`, `lng`. |

## Business Rules

1. **Search requires at least one filter**: text query, category, or location. An empty request returns `400`.
2. **Only active Welpers with completed profiles** appear in results. `profileVisibility = 'public'` and at least one active offering required.
3. **Inactive service offerings** are excluded from results.
4. **Location matching**: a Welper appears in results if the search location is within their service area radius (profile-level or offering-level).
5. **Default radius**: if location is provided without a radius, 25km is used.
6. **Pagination limits**: max 50 results per page to prevent performance degradation.
7. **Geocode caching**: identical address strings return cached coordinates for the LRU TTL duration.
8. **Geocode fallback**: if the provider is unavailable, the endpoint returns `null` coordinates with a warning (does not throw).

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Depends on** | Profile Management | Welper profiles, service offerings, availability data |
| **Depends on** | Content Management | Category tree for filtering and display |
| **Depends on** | Geocode (internal) | Address → coordinates resolution |
| **Depends on** | Review & Rating (future) | Average rating and review count per Welper |
| **Consumed by** | Booking & Scheduling | Customer selects a service from search results → creates booking |
| **Consumed by** | Job Posting & Matching | Categories shared for job posting |

## Security Considerations

- Search endpoints are public (no auth required) to allow browsing without sign-up
- Geocode endpoints require Bearer auth to prevent abuse (Google Maps API costs money)
- Rate limiting via `@nestjs/throttler` on geocode endpoints (stricter than other endpoints)
- Welper exact address is never exposed in search results — only distance and general service area

## Implementation Notes

- The search query is built dynamically using TypeORM `QueryBuilder` with conditional `.andWhere()` clauses based on provided filters
- `pg_trgm` and `unaccent` extensions are enabled via database migration
- `GIN` index on the `tsvector` column and `GiST` index on trigram columns for performance
- The `ServiceDiscoveryModule` imports `ProfileManagementModule` and `ContentManagementModule` for in-process data access
- The `GeocodeModule` is a standalone module with `IGeocodeService` interface; current implementation is `GoogleMapsGeocodeService`
- Search results are not cached server-side — every request hits the database with the constructed query. Caching can be added later if needed.
- The `earth_distance` approach avoids PostGIS dependency while providing accurate-enough distance calculations for a city-scale marketplace
