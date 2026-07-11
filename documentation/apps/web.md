# apps/web — Customer & Welper Web App

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Next.js app for customers and Welpers (marketplace, booking, dashboard, marketing site). Runs on **port 8081** (`next dev -p 8081`).

## Stack

| Dependency | Version | Role |
|---|---|---|
| `next` | 16.2.3 | App Router; request middleware lives in `apps/web/proxy.ts` |
| `react` / `react-dom` | 19.2.0 | UI |
| `next-auth` | 5.0.0-beta.25 | Session management (JWT strategy) — see [../architecture/authentication.md](../architecture/authentication.md) |
| `next-intl` | ^4.13.0 | i18n (`en` / `fr`), wired via `createNextIntlPlugin("./i18n/request.ts")` in `next.config.ts` |
| `@tanstack/react-query` | ^5.62.11 | Server-state fetching/caching |
| `zustand` | ^5.0.2 | Client-side state |
| `@radix-ui/themes` | 3.3.0 | Design primitives |
| `@welpco/ui`, `@welpco/types`, `@welpco/email` | workspace | Shared packages |
| `@stripe/react-stripe-js` / `@stripe/stripe-js` | ^6 / ^9 | Payments UI |
| `react-hook-form` + `zod` + `@hookform/resolvers` | — | Forms/validation |
| `next-mdx-remote`, `gray-matter`, `remark-gfm` | — | Blog/legal MDX content |
| `@playwright/test` | ^1.48.0 | E2E tests under `apps/web/e2e/` |

## App Router structure (`apps/web/app/`)

| Segment | Routes | Notes |
|---|---|---|
| `[locale]/(marketing)` | `/`, `/about`, `/how-it-works`, `/faq`, `/contact`, `/legal/{privacy,terms,cancellation,refund,code-of-conduct,...}` | Locale-prefixed marketing site (`en` unprefixed, `/fr/...`) |
| `[locale]/(auth)` | `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verification` | Auth pages |
| `[locale]/search` | `/search` | Locale-aware search |
| `(dashboard)/dashboard` | `/dashboard`, `/dashboard/{bookings,disputes,marketplace,messages,notifications,profile,search,settings}` | Authenticated app shell |
| `(marketing)` | `/blog`, `/blog/[slug]`, `/legal/{privacy,terms}` | Unprefixed marketing/blog (MDX) |
| `search`, `welper/[id]` | `/search`, `/welper/[id]` | Public search + Welper profile |
| `api/` | `/api/auth/[...nextauth]`, `/api/contact`, `/api/health` | Route handlers; `/api/contact` verifies Turnstile server-side |
| Root files | `layout.tsx`, `error.tsx`, `manifest.ts`, `robots.ts`, `sitemap.ts`, `globals.css` | |

`apps/web/proxy.ts` (Next 16 middleware) composes NextAuth's `auth()` with `next-intl` middleware: geo/cookie locale resolution, French `/legal` redirects, and safe `next=` redirect handling.

## Component organization (`apps/web/components/`)

- `components/features/` — domain features: `auth/`, `booking/`, `dashboard/`, `marketing/`, `marketplace/`, `payments/`, `personalization/`.
- `components/ui/` — local client wrappers around `@radix-ui/themes` primitives (e.g. `components/ui/button.tsx` wraps Radix `Button` with defaults). `@welpco/ui` (shared workspace package) is imported directly in ~84 files across `app/`, `components/`, `lib/`.
- `components/layout/`, `components/providers/` (React Query provider, PWA registration), `components/security/` (Turnstile widget), `components/error-boundary.tsx`.

### Marketing exception

`components/features/marketing/` has its own `CLAUDE.md`: it is a **faithful port of a design-handoff bundle** (`apps/web/.design-reference/`) and is explicitly exempt from design-system discipline — heavy inline `style={{}}`, raw hex tokens in `app/tokens.css`, its own `.btn`/`.card`/`.pill` class system, and **no `@welpco/ui` primitives**. WCAG AA contrast, reduced-motion support, and server-components-by-default still apply there.

## Data fetching / BFF access

- `lib/api/client.ts` — singleton `ApiClient` (`apiClient`) with `get/post/put/patch/delete`. Base URL: `process.env.NEXT_PUBLIC_API_URL` (default `http://localhost:3000`). Adds `Authorization: Bearer <accessToken>` unless `skipAuth: true`; 30s request timeout; on 401 clears the token cache and retries once (letting NextAuth's JWT callback refresh). Typed errors: `ApiClientError`, `EmailVerificationRequiredError`, `EmailAlreadyVerifiedError`.
- `lib/api/get-token.ts` — resolves the BFF access token from the NextAuth session (client: `getSession()` with a 30s module cache; server: `auth()`).
- `lib/services/*.ts` — per-domain service modules built on `apiClient` (booking, payments, profile, signup, disputes, notifications, service discovery, Stripe Connect, uploads, etc.). Components consume them via TanStack Query; `zustand` holds client-only state.

## PWA

- `app/manifest.ts` — web app manifest (`standalone`, `start_url: /dashboard`, theme `#2f6f4e`).
- `public/sw.js` — hand-written service worker (`welpco-pwa-v1`): precaches icons + `/offline.html`, offline fallback.
- `components/providers/pwa-service-worker.tsx` — registers `/sw.js` on the client.

## Scripts (`apps/web/package.json`)

| Script | Command |
|---|---|
| `dev` | `next dev -p 8081` |
| `build` / `start` | `next build` / `next start -p 8081` |
| `lint` | `eslint .` |
| `type-check` | `tsc --noEmit` |
| `test:e2e` | `playwright test` (browsers in `.playwright-browsers`) |
| `test:e2e:install` | `playwright install chromium` |
| `test:e2e:personalization` / `test:e2e:profile` / `test:e2e:auth` | Scoped Playwright runs (`e2e/personalization/`, `e2e/profile/`, `--grep '@auth'`) |
| `test:e2e:ui` / `test:e2e:headed` / `test:e2e:debug` | Playwright UI / headed / debug modes |
| `i18n:audit-service-questions` / `i18n:build-service-questions` | Service-question copy tooling (`scripts/*.mjs`) |
