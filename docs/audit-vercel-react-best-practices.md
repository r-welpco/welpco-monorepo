# Vercel React Best Practices – Web App Audit

Audit of `apps/web` against the [Vercel React Best Practices](https://github.com/vercel/react-best-practices) (57 rules in 8 categories). Findings are grouped by priority and include file references and concrete recommendations.

---

## Executive Summary

| Category                    | Status   | Notes |
|----------------------------|----------|--------|
| 1. Eliminating Waterfalls  | Partial  | No Suspense; layout/page may double auth |
| 2. Bundle Size             | Good     | One barrel import; dynamic used in 2 places |
| 3. Server-Side Performance  | Good     | `React.cache()` in profile-service; auth on server |
| 4. Client Data Fetching    | Good     | TanStack Query (dedup); no SWR needed |
| 5. Re-render Optimization  | Partial  | Some derived state in effects; no useTransition |
| 6. Rendering Performance   | Partial  | Many `&&` conditionals; no content-visibility on lists |
| 7. JavaScript Performance  | Minor    | localStorage not versioned; no scroll passive |
| 8. Advanced Patterns       | Minor    | No useLatest/init-once issues noted |

---

## 1. Eliminating Waterfalls (CRITICAL)

### async-parallel / async-dependencies
- **Status:** No clear sequential await chains for independent work in app code. E2E and helpers use `Promise.all` where appropriate.
- **Note:** Server pages each `await requireOnboardingComplete()`; layout and page both do this, so auth runs per-route (no shared cache for auth).

### async-suspense-boundaries
- **Status:** Not used.
- **Finding:** No `<Suspense>` boundaries in the app. Streaming and incremental loading could be improved by wrapping lazy or async sections (e.g. dashboard content, search results) in Suspense with fallbacks.
- **Files:** `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard/page.tsx`, search page-client.
- **Recommendation:** Add Suspense around main content and use `loading.tsx` or explicit `<Suspense fallback={…}>` for better TTFB and perceived performance.

### async-api-routes
- **Status:** N/A for this audit (focused on app router and client).

---

## 2. Bundle Size Optimization (CRITICAL)

### bundle-barrel-imports
- **Status:** One violation.
- **Finding:** `app/page.tsx` imports from the package barrel: `import { Box } from "@welpco/ui"`. The rest of the app correctly uses direct imports (e.g. `@welpco/ui/box`, `@welpco/ui/flex`). The UI package has a large `index.ts` that re-exports many components.
- **File:** `apps/web/app/page.tsx` (line 4).
- **Recommendation:** Change to `import { Box } from "@welpco/ui/box"` to avoid pulling in the barrel and keep bundles smaller.

### bundle-dynamic-imports
- **Status:** Good.
- **Finding:** `next/dynamic` is used for:
  - `PersonalizationSettings` on the settings page (loaded only when “Appearance” tab is relevant).
  - `ReactQueryDevtools` in `query-provider.tsx` with `ssr: false`.
- **Files:** `app/(dashboard)/dashboard/settings/page.tsx`, `lib/providers/query-provider.tsx`.

### bundle-defer-third-party / bundle-conditional / bundle-preload
- **Status:** Devtools are loaded conditionally (`NODE_ENV === "development"`). No analytics or heavy third-party scripts were audited; consider deferring any analytics until after hydration. Preload on hover/focus not checked.

---

## 3. Server-Side Performance (HIGH)

### server-auth-actions
- **Status:** Good.
- **Finding:** Server components use `requireOnboardingComplete()` from `lib/auth/server-auth.ts`; auth is enforced on the server before rendering. No server actions were in scope; when you add them, protect them the same way (e.g. check session/server user).

### server-cache-react
- **Status:** Good.
- **Finding:** `lib/services/profile-service.ts` uses `cache()` (React’s cache) for per-request deduplication on:
  - `getCustomerProfile`, `getWelperProfile`, `getServiceOfferings`, `getAvailability`, `getAvailabilityExceptions`, `getFavoriteWelpers`, `getServicePreferences`.
- **File:** `apps/web/lib/services/profile-service.ts`.

### server-dedup-props / server-parallel-fetching
- **Status:** Possible duplicate auth work.
- **Finding:** Dashboard layout and each dashboard page (e.g. dashboard, profile, booking/new) each call `await requireOnboardingComplete()`. So for a single request you may run the auth/redirect chain twice (layout + page). Session from `auth()` is not wrapped in React `cache()`.
- **Files:** `app/(dashboard)/layout.tsx`, `app/(dashboard)/dashboard/page.tsx`, `app/(dashboard)/dashboard/profile/page.tsx`, `app/(dashboard)/dashboard/booking/new/page.tsx`.
- **Recommendation:** Either:
  - Use a single auth check in the layout and pass the user down (no auth in child pages), or
  - Wrap `getServerSession()` / `auth()` in `cache()` so that multiple `requireOnboardingComplete()` calls in the same request only hit the backend once.

### server-serialization
- **Status:** Reasonable. Layout and pages pass minimal user props (`id`, `email`, `role`, `emailVerified`, `onboardingCompleted`) to client components. No obvious over-serialization spotted.

### server-after-nonblocking
- **Status:** Not audited in depth. Use `after()` for non-blocking work (e.g. logging, analytics) where applicable so they don’t delay the response.

---

## 4. Client-Side Data Fetching (MEDIUM–HIGH)

### client-swr-dedup
- **Status:** Good (equivalent pattern).
- **Finding:** The app uses **TanStack Query** (`useQuery` / `useMutation`) everywhere for server state. Query keys and `staleTime` provide deduplication and caching (e.g. `use-service-discovery.ts`, `use-bookings.ts`, `use-profile.ts`, `use-content.ts`). No SWR; no need to introduce it if you standardize on React Query.

### client-event-listeners
- **Status:** Adequate. Resize and media-query listeners are set up in `useEffect` with cleanup. No obvious duplicate global listeners.

### client-passive-event-listeners
- **Status:** N/A.
- **Finding:** No `scroll` event listeners were found; only `resize`, `change` (mediaQuery), and `mousemove`/`mouseleave`. If you add scroll handlers, use `{ passive: true }` where you don’t call `preventDefault()`.

### client-localstorage-schema
- **Status:** Partial.
- **Finding:**  
  - `personalizationStore.ts`: uses `welpco-personalization` with a fixed shape; no version field. If you change the schema, old clients may parse invalid data.  
  - Login page: `rememberEmail` is a single string; no version.  
- **Recommendation:** Add a `version` (or `schemaVersion`) to persisted objects and handle migration or clear old keys when version changes. Minimize what you store.

---

## 5. Re-render Optimization (MEDIUM)

### rerender-derived-state-no-effect
- **Status:** Partial.
- **Finding:** Layout client syncs server user to client store in an effect (`layout-client.tsx`). The “effective user” could be derived as “serverUser ?? clientUser” and only the store update (if needed) done in an effect, to avoid extra renders. Same pattern in `dashboard/page-client.tsx` and `profile/page-client.tsx` (sync server user to store in effect).
- **Files:** `app/(dashboard)/layout-client.tsx`, `app/(dashboard)/dashboard/page-client.tsx`, `app/(dashboard)/dashboard/profile/page-client.tsx`.
- **Recommendation:** Prefer deriving “current user” from props/state during render; use effect only to push server user into the store when it changes, and keep dependency arrays minimal.

### rerender-memo / rerender-memo-with-default-value
- **Status:** Good.
- **Finding:** `memo` is used where it makes sense: `FloatingWelperCard`, `RecentActivity`, `StatCard`. Heavier lists (e.g. search results) use `useMemo` for derived data. No obvious over-use of memo for trivial components.

### rerender-lazy-state-init
- **Status:** Good.
- **Finding:**  
  - `QueryProvider`: `useState(() => new QueryClient(...))` (lazy init).  
  - Login: `useState(() => localStorage.getItem("rememberEmail"))` for initial email.  
  - Settings: `useState(() => [...])` for notifications and privacy initial state.

### rerender-transitions
- **Status:** Not used.
- **Finding:** No `useTransition` or `startTransition`. Non-urgent UI updates (e.g. filter changes, tab switches, search result updates) could be wrapped in `startTransition` to keep typing and clicks responsive.
- **Recommendation:** Consider `useTransition` for search/filter state and heavy list updates so the UI stays responsive.

### rerender-dependencies / rerender-defer-reads / rerender-move-effect-to-event
- **Status:** Not fully audited. Theme-provider has `loadFromStorage` in the dependency array of an effect; ensure it’s stable (e.g. from Zustand selector or ref) to avoid unnecessary re-runs. Any logic that only runs in response to user actions should live in event handlers where possible.

---

## 6. Rendering Performance (MEDIUM)

### rendering-conditional-render
- **Status:** Partial.
- **Finding:** Many conditional renders use `&&`, which can render `0` or `NaN` if the left-hand side is a number. Most usages are booleans or “element && jsx”, so risk is low, but the rule recommends ternary for clarity and safety.
- **Examples:**  
  - `search/page-client.tsx`: `{showLocationPrompt && (...)`, `{showResults && (...)`, `{(hasPrev || hasNext) && (...)`, `{isLoading && !isError && (...)`.  
  - `welper/[id]/page.tsx`: `{profile.bio && (...)`, `{profile.serviceOfferings && profile.serviceOfferings.length > 0 && (...)`.  
  - Similar patterns in `booking/new/page-client.tsx`, `layout-client.tsx`, `dashboard/page-client.tsx`, `profile/page-client.tsx`, login, adaptive-header, etc.
- **Recommendation:** For conditions that are or could be numeric (counts, indexes), use `condition ? <Component /> : null`. For pure booleans, `&&` is acceptable but ternary is consistent and avoids edge cases.

### rendering-content-visibility
- **Status:** Not used.
- **Finding:** Long lists (e.g. search results, bookings, dashboard activity) do not use `content-visibility: auto` (or similar) for off-screen rows. This can help with long lists and complex cards.
- **Recommendation:** On list containers or list item wrappers (e.g. `SearchResultsList`, grid of `WelperProfileCardCompact`), consider `content-visibility: auto` and `contain-intrinsic-size` to improve scroll/layout performance.

### rendering-hoist-jsx / rendering-usetransition-loading
- **Status:** Not audited in detail. Prefer `useTransition` for loading states over ad-hoc loading flags where it improves perceived responsiveness.

### rendering-hydration-no-flicker / rendering-activity
- **Status:** Theme and layout use a `mounted` flag and render a default (e.g. light theme, null) until mounted to avoid hydration mismatch. Acceptable. No Activity component usage noted.

---

## 7. JavaScript Performance (LOW–MEDIUM)

### js-cache-storage
- **Status:** Partial.
- **Finding:** Login page correctly uses lazy `useState` to read `rememberEmail` once. Personalization store reads localStorage on init and on `loadFromStorage()`; repeated reads could be cached in module or ref if needed. E2E clears localStorage/sessionStorage; app code doesn’t cache storage reads elsewhere in a way that was flagged.

### js-early-exit / js-set-map-lookups / js-combine-iterations
- **Status:** Not systematically audited. Search and filter logic use arrays and objects; if you have hot paths with repeated lookups (e.g. by id), consider `Map`/`Set` and single-pass loops.

---

## 8. Advanced Patterns (LOW)

- **advanced-event-handler-refs / advanced-use-latest:** Not required for current code. If you pass callbacks to non-React code or need a “latest” callback without changing identity, consider a ref or useLatest.
- **advanced-init-once:** QueryClient is created once per provider instance (lazy useState). No obvious init-once issues.

---

## Recommended Action List (Priority Order)

1. **CRITICAL – Barrel import:** In `app/page.tsx`, change `import { Box } from "@welpco/ui"` to `import { Box } from "@welpco/ui/box"`.
2. **HIGH – Auth dedup:** Cache server auth (e.g. wrap `auth()` or `getServerSession()` in `cache()`) or centralize auth in the dashboard layout and stop calling `requireOnboardingComplete()` in each page.
3. **MEDIUM – Suspense:** Add Suspense boundaries (and optionally loading.tsx) for dashboard and search to enable streaming and better perceived performance.
4. **MEDIUM – useTransition:** Use `useTransition` for non-urgent state updates (search params, filters, tab switches) to keep the UI responsive.
5. **MEDIUM – Derived state:** In layout-client and dashboard/profile page-clients, derive “current user” during render where possible; limit effect to syncing server user into the store.
6. **MEDIUM – content-visibility:** Consider `content-visibility: auto` (and contain-intrinsic-size) on long list containers (search results, bookings, activity).
7. **LOW – Conditional render:** Replace `&&` with ternary where the left-hand side can be a number (e.g. counts).
8. **LOW – localStorage schema:** Add a version field to `welpco-personalization` (and any other persisted schema) and handle migrations or clear old data.

---

## Summary Table by Rule Category

| Rule / Area                  | Result | Action |
|-----------------------------|--------|--------|
| async-suspense-boundaries   | Missing | Add Suspense + fallbacks |
| bundle-barrel-imports       | 1 violation | Fix `app/page.tsx` |
| server-cache-react          | OK | Keep using cache() in profile-service |
| server-dedup-props / auth   | Duplicate auth | Cache auth or centralize in layout |
| client-swr-dedup            | OK | TanStack Query in use |
| client-localstorage-schema  | Partial | Version + migrate personalization (and rememberEmail if needed) |
| rerender-derived-state-no-effect | Partial | Derive user in render; effect only for store sync |
| rerender-transitions        | Missing | Add for filters/search/tabs |
| rendering-conditional-render | Partial | Prefer ternary for numeric conditions |
| rendering-content-visibility | Missing | Use on long lists |
| client-passive-event-listeners | N/A | Use passive for any new scroll listeners |

This audit was performed against the Vercel React Best Practices skill and the current `apps/web` codebase. Re-run checks after refactors and when adding new features (data fetching, new pages, new lists, and client state).
