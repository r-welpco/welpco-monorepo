# Audit: Search Welpers (Location, Radius, Categories, Performance)

This document captures findings from an audit of the “Search Welpers” flow: search by location and radius, category/subcategory usage, potential bugs, unnecessary complexity, and improvement opportunities.

---

## Resolved (2025-02)

The following items were addressed by the “Fix Search Welpers Audit” implementation:

- **1.1 Radius / 4.1 Single pipeline:** Search was refactored to a single SQL pipeline; radius (and location, price, rating) are applied in one flow for all cases (including no category and no text). No early return that skips radius.
- **1.2 Country/province:** Added `country_code` and `province_code` columns to `welper_profiles`; seed and backfill set them (e.g. Quebec seed uses CA/QC); filter and location display use these columns (with fallback to `service_area` JSON).
- **1.3 Price and rating:** Added `minPrice`, `maxPrice`, `minRating` to BFF search API; added `rating` and `review_count` to `welper_profiles`; sidebar is wired to URL and API.
- **2.1 Province format:** Nominatim implementation normalizes province (e.g. `CA-QC` → `QC`, state names → codes for CA/US).
- **2.2 Optional number params:** `@Transform` added for optional number query params to coerce empty string to `undefined`.
- **2.3 Sort by distance:** Added `sort=distance` when lat/lng (or postal) are present; BFF orders by `earth_distance`.
- **2.4 Postal code:** Forward geocode (postal + country → lat/lng) in BFF; search accepts `postalCode` and resolves it at the start of `searchServices`; frontend has postal code input and passes `postalCode` in params.
- **2.5 Sentinel consistency:** Category “any” uses the same sentinel `__any__` (FILTER_ANY) as country/province/radius.
- **2.6 Category validation:** Search page validates `categoryId` against `categoryOptions` and clears URL if invalid.
- **4.1–4.3 Single pipeline / duplication:** One pipeline: base set (with optional category/text) → location (columns) → radius → price/rating → sort → paginate; all in SQL with a single QueryBuilder and separate count.
- **4.4 Geocode abstraction:** Introduced `IGeocodeService` and `NominatimGeocodeService` with reverse, forward, province normalization, and in-memory cache (+ throttle).
- **5.2 Nominatim cache:** Reverse and forward results cached by rounded coords / postal|country with TTL.

**Deferred:** Spatial index (PostGIS), category counts (includeCounts), category cache invalidation on write.

---

## Simplified location flow (2025-02)

The search-by-location UX was simplified to reduce confusion:

- **Location required:** Users must provide a location via **postal code** (hero input) OR **“Use my location”** before results are shown. The search request is only sent when a center is available (`hasSearchCenter`).
- **Country and province filters removed:** Location filtering is done only by radius around the search center (postal or lat/lng). No country/province dropdowns in the UI; `countryCode` is used only for postal disambiguation (default CA) when calling the BFF.
- **Hero = location:** The main hero is in `mode="location"`: postal code input + “Use my location” button. Category pills remain below.
- **Keyword optional in sidebar:** Text search (name, bio, service description) is an optional “Keyword” field in the filters sidebar, not the main hero input.
- **Radius:** Shown whenever a location is set (postal or lat/lng). Default 25 km when setting location via postal. Sort by distance appears when location is set.
- **Postal geocode failure:** When the user submits a postal code and the BFF forward geocode fails, the BFF returns 400 with a clear message. The frontend shows: “We couldn’t find that postal code. Try another or use your location.”

---

## 1. Critical gaps and bugs

### 1.1 Radius filter never applied when there is no category and no text query

**Location:** `apps/bff/src/domains/service-discovery/service-discovery.service.ts`

**Issue:** When the user has only location filters (e.g. “Use my location” with lat/lng/radius) and no `categoryId` and no `q`, the code takes the first branch (`if (!categoryId && !q)`), builds `welperIds` with optional country/province filter, then **returns immediately** (lines 168–193). The radius filter (lines 304–319) is never executed.

**Impact:** “Use my location” + radius alone (no search text, no category) returns all complete/public welpers (paginated) and ignores distance. Users expect results within the chosen radius.

**Fix:** In the `!categoryId && !q` branch, after building `welperIds`, apply `hasRadiusFilter` the same way as in the rest of the flow (filter by `earth_distance`), then recompute `total` and paginate. Alternatively, refactor so a single code path applies location + radius for all branches.

---

### 1.2 Country/province filter incompatible with GeoJSON Point–only `service_area`

**Location:** BFF `service-discovery.service.ts` (e.g. lines 148–149, 295–296), `serviceAreaSummary()` (lines 25–32).

**Issue:** Location filter uses:

- `p.service_area->>'country' = :countryCode`
- `p.service_area->>'province' = :provinceCode`

`service_area` can be:

- A **GeoJSON Point** `{ type: 'Point', coordinates: [lng, lat] }` (e.g. Quebec seed welpers) — no `country` or `province` keys.
- A legacy/admin-defined object with `country` / `province` (not consistently used).

So:

- Welpers with **Point-only** data never match country/province filters.
- “Use my location” sets country/province from reverse geocode; those welpers are then filtered out, so Quebec seed welpers don’t appear when filtering by Quebec.
- `serviceAreaSummary(profile.serviceArea)` only reads `country`/`province`; for Point-only it always returns `"—"`, so the UI never shows a meaningful location for those welpers.

**Impact:** Location filter and location display are broken for all profiles that store only a GeoJSON Point (e.g. current Quebec seed data).

**Fix (choose one or combine):**

- **Option A:** Add nullable `country_code` and `province_code` columns on `welper_profiles`, backfill from reverse geocode (or from Point + reverse geocode), and use them for filtering and display. Keep `service_area` for GeoJSON.
- **Option B:** When storing a Point (e.g. in welper onboarding or seed), also set `country` and `province` on the same JSON (or in a separate structure) from reverse geocode so current JSON filters and `serviceAreaSummary` work.
- **Option C:** For radius-only search, do not require country/province; for “Use my location”, either set only lat/lng/radius and rely on radius, or ensure reverse-geocode result is persisted on the profile so filters align.

---

### 1.3 Price and rating filters in sidebar are not applied to the API

**Location:** `packages/ui/src/platform/service-discovery/search-filters-sidebar.tsx` (price range and min. rating state), `apps/web/.../search/page-client.tsx`, BFF `SearchServicesQueryDto`.

**Issue:** The sidebar has local state for “Price range” (`priceRange`) and “Min. rating” (`rating`). These are never passed to `updateParams` or to the search API. The BFF has no `minPrice`, `maxPrice`, or `minRating` (or similar) query parameters.

**Impact:** Users can change price and rating filters but results do not change. Misleading UX and dead code.

**Fix:** Either:

- Remove price/rating controls from the sidebar until the API supports them, or
- Add `minPrice`, `maxPrice`, `minRating` to the BFF search API and wire the sidebar to URL params and the API.

---

## 2. Important gaps and potential bugs

### 2.1 Province code format from Nominatim vs filter

**Location:** `apps/bff/src/domains/geocode/geocode.service.ts` (e.g. `addr['ISO3166-2-lvl4'] ?? addr.state`), frontend `PROVINCES_BY_COUNTRY` (e.g. `QC` for Quebec).

**Issue:** Nominatim can return province/state as:

- `ISO3166-2-lvl4` (e.g. `CA-QC`) or
- `state` (e.g. `Quebec` or `QC`).

The BFF returns that as `provinceCode`. The frontend dropdown and BFF filter use two-letter codes like `QC`. If the API returns `CA-QC` or `Quebec`, the URL may store that and the filter may not match welpers stored with `QC`.

**Impact:** “Use my location” in Quebec might set a province code that doesn’t match stored data, leading to zero results even when province filter is intended.

**Fix:** Normalize province in the BFF geocode response (e.g. map `CA-QC` → `QC`, and optionally map known state names to codes). Document expected format for `service_area.province` and any `province_code` column.

---

### 2.2 Optional number query params (latitude, longitude, radiusKm)

**Location:** `SearchServicesQueryDto` with `@Type(() => Number)` and `@IsNumber()`.

**Issue:** If the client sends an empty value (e.g. `?latitude=&longitude=`) or a non-numeric string, transformation can yield `NaN`, and validation may fail or propagate NaN.

**Fix:** Add `@Transform` to coerce empty string to `undefined`, or validate with a custom decorator that rejects `NaN`. Ensure optional number params are truly optional when omitted.

---

### 2.3 Radius “Any distance” with lat/lng

**Location:** Frontend: when user has lat/lng and selects “Any distance”, `radiusKm` is cleared; BFF then does not apply radius.

**Issue:** With lat/lng and “Any distance”, the API returns all welpers matching other filters (e.g. category), not sorted by distance. Users might expect “show everyone, sorted by distance”.

**Improvement:** Consider adding a `sort=distance` option when lat/lng are present, and optionally support “no radius limit” explicitly so the UI can show “Any distance” and still sort by distance.

---

### 2.4 Postal code not used in search

**Location:** Reverse geocode returns `postalCode`; frontend stores it in URL and state; BFF search does not use it.

**Issue:** Search API has no postal-code filter. Storing postal code in the URL suggests it matters, but it has no effect on results.

**Fix:** Either remove postal code from the search UI/URL until supported, or add a postal-code filter (or “search near this postal code” via geocode) and document behavior.

---

### 2.5 Inconsistent sentinel values for “any” in filters

**Location:** `SearchFiltersSidebar`: category uses `"any"`, country/province/radius use `"__any__"`.

**Issue:** Two different conventions; easy to mix up when adding new filters or refactoring.

**Fix:** Use a single sentinel (e.g. `"__any__"` or a constant) for all “any” options, or use `undefined`/empty and avoid sentinels in the API.

---

### 2.6 Category Select value when categoryId is undefined

**Location:** Sidebar `value={categoryId ?? "any"}`. There is a `SelectItem value="any">Any category</SelectItem>`.

**Issue:** If `categoryId` is `undefined`, Radix Select gets `value="any"`. This is correct. If the backend ever returns or the URL ever has an invalid (deleted) category ID, the Select might show a value that doesn’t exist in the list. No validation of `categoryId` against current categories.

**Improvement:** Validate `categoryId` against `categoryOptions`; if invalid, treat as “any” and optionally sync URL.

---

## 3. Categories, subcategories, and questions

### 3.1 Categories and subcategories

- **Resolution:** `resolveCategoryIds(categoryId)` correctly expands a parent category to its children for filtering offerings. So “Care” includes all subcategories. Subcategories are shown in the UI as “Parent · Sub” and can be selected; filtering by subcategory works.
- **Gap:** Search does not use `subcategoryIds` on service offerings. Offerings have `subcategoryIds` (array of UUIDs); search only filters by `serviceCategoryId`. So “filter by subcategory” is really “filter by this category (or subcategory) ID”; finer-grained subcategory filtering (e.g. only “Babysitter” under “Care”) works only because Babysitter is a category with its own ID. If “subcategory” is defined as a level-3 or tag-like concept stored only in `subcategoryIds`, search ignores it.
- **Note (Phase 1):** Search filters by `service_category_id` (level 1 or 2) only; `subcategoryIds` on offerings are not used in search. This is intentional for the current scope.

### 3.2 Questions

- **Usage:** Questions and `service_questions` are used in the **booking** flow (e.g. required answers, showIf). They are **not** used in service discovery search.
- **Note (Phase 1):** No search by question answers or service attributes derived from questions. If product later wants “filter by: has car”, that would require indexing or filtering by question/answer or derived attributes.

### 3.3 Category cache and counts

- **Cache:** `getCachedCategories()` caches for 5 minutes; no invalidation on category create/update/delete. Stale category list is possible after admin changes.
- **Counts:** `getCategories(includeCounts)` is reserved for “Phase 2”; counts are not implemented. UI does not show “X welpers” per category.

---

## 4. Unnecessary complexity and maintainability

### 4.1 Four separate code paths for building `welperIds`

**Location:** `service-discovery.service.ts`: (1) `!categoryId && !q`, (2) `categoryId && !q`, (3) `!categoryId && q`, (4) `categoryId && q`.

**Issue:** Location and radius are applied only in paths (2)–(4) (and only after building `welperIds`). Path (1) has its own pagination and return and never applies radius. Logic is duplicated and easy to break when adding a new filter.

**Recommendation:** Refactor to a single pipeline: (a) resolve base welper IDs (by category and/or text), (b) apply country/province filter, (c) apply radius filter, (d) sort, (e) paginate and build items. The “no category, no q” case is then “all complete/public welpers” as the base set, and (b)–(e) apply uniformly.

---

### 4.2 In-memory pagination and sorting

**Issue:** For category and/or text search, the service loads **all** matching welper IDs into memory, then applies location and radius, then sorts (e.g. by price) with another query, then slices `welperIds.slice(start, start + limit)`. Total count is `welperIds.length`.

**Impact:** With large datasets (e.g. 10k+ welpers), this does not scale (memory, latency, and multiple round-trips).

**Recommendation:** Move filtering, sorting, and pagination into one or two SQL queries (e.g. query builder with JOINs, `ORDER BY` min price or distance, `LIMIT`/`OFFSET` or keyset pagination). Compute total with a `COUNT(*)` or a separate count query if needed.

---

### 4.3 Duplicate location filter logic

**Location:** Country/province conditions appear both in the `!categoryId && !q` branch (in the initial qb) and again later (lines 289–302) for other branches.

**Recommendation:** Unify in the single pipeline so location is applied once, in one place.

---

### 4.4 Geocode provider hardcoded and not extensible

**Location:** `geocode.service.ts`: only `nominatim` is supported; throws if `GEOCODE_PROVIDER` is anything else.

**Issue:** Adding Google or Mapbox would require branching or a new implementation; no interface/strategy for multiple providers.

**Recommendation:** Introduce a small geocode abstraction (e.g. `IGeocodeService.reverse(lat, lng)`) and implement Nominatim (and later others) behind it. Keep provider-specific parsing and normalization (e.g. province code) inside each implementation.

---

## 5. Performance and reliability

### 5.1 No database index for location/radius

**Location:** `welper_profiles` table.

**Issue:** Radius filter uses `earth_distance(ll_to_earth(...), ll_to_earth(...))`. Without a spatial index, every search does a full table scan over welpers with non-null lat/lng.

**Recommendation:** Consider PostGIS and a spatial index (e.g. on a geography column derived from lat/lng) for radius queries at scale. Alternatively, document that radius search is best-effort for moderate dataset sizes.

---

### 5.2 Nominatim rate limits and availability

**Issue:** Nominatim usage policy requires rate limiting (e.g. 1 req/s). No retry, no caching, no fallback. If Nominatim is down or rate-limited, “Use my location” fails for all users.

**Recommendation:** Add a short-lived cache (e.g. by rounded lat/lng) for reverse geocode results, respect rate limits (e.g. client-side or BFF throttling), and consider a fallback (e.g. return lat/lng only and still set radius so radius search works even when reverse geocode fails).

---

### 5.3 Categories loaded on every search

**Location:** `getCachedCategories()` is used for building the category map and for result items. Cache is in-memory, 5 min TTL.

**Issue:** First request after startup or after TTL expiry loads all categories. For a single backend this is acceptable; if the service is scaled horizontally, each instance has its own cache and may be slightly stale.

**Recommendation:** Keep cache; add invalidation (e.g. on category write) if admin changes categories frequently. For multi-instance, consider a shared cache or short TTL.

---

## 6. Summary table

| Severity   | Area              | Finding                                                                 | Suggested action                                      |
|-----------|-------------------|--------------------------------------------------------------------------|--------------------------------------------------------|
| Critical  | Radius            | Radius not applied when no category and no q                            | Apply radius in the “no category, no q” branch or unify path |
| Critical  | Location          | Country/province filter and display assume non-Point service_area       | Add country/province columns or store in JSON; unify model |
| Critical  | Sidebar           | Price and rating filters not sent to API                                | Remove or implement in API and wire to URL/params      |
| Important | Geocode           | Province code format (e.g. CA-QC vs QC) may not match filter             | Normalize province in BFF geocode response             |
| Important | Query params      | Empty/non-numeric number params can yield NaN                            | Transform/validate optional numbers                     |
| Important | UX                | “Any distance” with lat/lng doesn’t sort by distance                     | Consider sort=distance when lat/lng present            |
| Important | Data model        | Postal code in URL but not used in search                               | Remove from URL or add postal-code filter/geocode      |
| Important | Consistency       | Sentinel "any" vs "__any__"                                              | Unify sentinel for “any” options                       |
| Medium    | Categories        | subcategoryIds on offerings not used in search                          | Document; extend search if product needs it            |
| Medium    | Questions         | Not used in search                                                       | Document as intentional for Phase 1                    |
| Medium    | Complexity        | Four branches for welper IDs; duplicated location logic                  | Single pipeline: base IDs → location → radius → sort → page |
| Medium    | Performance       | All matching IDs loaded then sliced                                     | Push filter/sort/pagination into SQL                   |
| Medium    | Geocode           | Single provider, no abstraction                                          | Introduce IGeocodeService and provider implementations  |
| Low       | Index             | No spatial index for radius                                             | Consider PostGIS / spatial index                        |
| Low       | Nominatim         | No cache, no retry, rate limits                                         | Cache by rounded coords; throttle; optional fallback   |

---

*Audit date: 2025-02. Codebase: welpco-monorepo (BFF, web app, UI package). Resolved items implemented 2025-02.*
