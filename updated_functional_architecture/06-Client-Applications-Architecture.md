# Client Applications Architecture — Final Decisions

> **Status**: APPROVED
> **Last Updated**: April 2026

## Deployment (current target)

- **`@welpco/web`** and **`@welpco/admin`**: **Vercel** (Next.js 16 App Router).
- **BFF**: not on Vercel — long-lived Node service; set `NEXT_PUBLIC_API_URL` (and admin equivalent) to the deployed API origin.

## Technology Stack

| Category | Technology | Version | Status |
|----------|-----------|---------|--------|
| **Framework** | Next.js (App Router) | 16.x | Final |
| **Runtime** | React | 19.x | Final |
| **Language** | TypeScript | 5.x | Final |
| **Auth** | NextAuth.js (Auth.js v5), **credentials only** | 5.x beta | Final (no social OAuth in current scope) |
| **Server State** | TanStack React Query | 5.x | Final |
| **Client State** | Zustand | 5.x | Final |
| **UI Library** | Radix UI Themes | 3.x | Final |
| **Forms** | React Hook Form + Zod | 7.x / 3.x | Final |
| **Icons** | Lucide React | Latest | Final |
| **E2E Testing** | Playwright | 1.x | Final |
| **Design System** | Storybook | Latest | Final |
| **Error Tracking** | Sentry | Latest | Final |
| **AI Chat** | Vercel AI SDK (`ai`) | Latest | Final |
| **Real-time** | Socket.io Client | Latest | Final |

## Architecture Patterns

### Server/Client Component Split

- **Server Components** (default): Data fetching, auth checks, SEO metadata
- **Client Components** (`"use client"`): Interactivity, forms, state, effects
- Naming convention: `page.tsx` (server) delegates to `page-client.tsx` (client)

### API Integration

- **Single backend**: All API calls go to the NestJS BFF at `NEXT_PUBLIC_API_URL`
- **API Client**: Custom fetch-based client with JWT injection from NextAuth session
- **Service Layer**: `lib/services/*.ts` — typed functions wrapping API client calls
- **React Query Hooks**: `lib/hooks/use-*.ts` — hooks wrapping service functions with caching

```
Component → React Query Hook → Service Function → API Client → BFF Backend
```

### Authentication Flow

1. User submits credentials via NextAuth `signIn("credentials", ...)`
2. NextAuth credentials provider calls BFF `/api/auth/login`
3. BFF returns JWT access + refresh tokens
4. NextAuth stores tokens in encrypted JWT session
5. API client extracts access token from session for authenticated requests
6. Token refresh handled automatically in NextAuth JWT callback

### State Management

| State Type | Tool | Examples |
|-----------|------|---------|
| Server/async data | React Query | Profiles, bookings, search results |
| Auth session | NextAuth `useSession()` | User identity, tokens |
| UI preferences | Zustand (persisted) | Theme, backgrounds, sidebar |
| Form state | React Hook Form | Registration, profile edit |
| URL state | `useSearchParams()` | Search filters, pagination |

### Shared UI Package (`@welpco/ui`)

- Radix UI Themes components re-exported with consistent API
- Platform-specific components organized by domain:
  - `@welpco/ui/platform/user-management` — Login, registration forms
  - `@welpco/ui/platform/profile-management` — Profile forms, service offerings
  - `@welpco/ui/platform/service-discovery` — Search, welper cards
  - `@welpco/ui/platform/booking-scheduling` — Booking forms
  - `@welpco/ui/platform/layout` — Header, footer, navigation
- Subpath exports for tree-shaking: `@welpco/ui/button`, `@welpco/ui/card`, etc.

## Route Structure

### Public Routes
| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/search` | Public service search |
| `/welper/[id]` | Public welper profile |

### Auth Routes (Route Group: `(auth)`)
| Route | Description |
|-------|-------------|
| `/login` | Login |
| `/register` | Registration (customer/welper) |
| `/verification` | Email verification |
| `/forgot-password` | Password reset request |
| `/reset-password` | Password reset confirmation |
| `/onboarding` | Onboarding flow |

### Dashboard Routes (Route Group: `(dashboard)`)
| Route | Description |
|-------|-------------|
| `/dashboard` | Main dashboard |
| `/dashboard/search` | Authenticated search |
| `/dashboard/profile` | Profile management |
| `/dashboard/bookings` | Booking list |
| `/dashboard/booking/new` | Create booking |
| `/dashboard/messages` | Messages (planned) |
| `/dashboard/settings` | Account settings |
| `/dashboard/chat` | AI chatbot (planned) |

## AI Chat Integration (Planned)

The `/dashboard/chat` page will be the AI Conversational Experience:

- **Vercel AI SDK** streams AI responses with generative UI
- **Voice input**: Web Speech API with Whisper fallback
- AI renders interactive React components inline (welper cards, calendars, booking forms)
- Full booking flow completable within the chat

## Performance Practices

- `useMemo` / `useCallback` for expensive computations and callback props
- React Query for server state caching (avoids duplicate Zustand stores)
- `content-visibility: auto` for long lists
- Dynamic imports for heavy components (settings, personalization)
- Turbopack for fast development builds

## Personalization

- **Client-side only** (Zustand persisted to localStorage)
- Features: theme mode (light/dark), translucent effects, background selection
- No backend storage required (cross-device sync is a future consideration)

## Security

- No secrets in client-side code
- JWT tokens stored in NextAuth encrypted session (not localStorage)
- `NEXTAUTH_SECRET` required (throws in production if missing)
- No dangerous email account linking for OAuth providers
- API client redirects to `/login` on 401
- All console.log calls with PII/tokens removed

## Ports

| Service | Port | URL |
|---------|------|-----|
| Web App (dev) | 8081 | http://localhost:8081 |
| BFF Backend | 3000 | http://localhost:3000 |
| Storybook | 6006 | http://localhost:6006 |
