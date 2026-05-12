# Welpco Monorepo — Comprehensive Project Report

> **Date:** March 7, 2026
> **Scope:** Full independent audit of architecture, code quality, design system, and data layer
> **Method:** Source code analysis — documentation was not taken at face value

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Monorepo Architecture](#3-monorepo-architecture)
4. [Applications](#4-applications)
5. [Shared Packages](#5-shared-packages)
6. [Design System](#6-design-system)
7. [Data Layer & Database](#7-data-layer--database)
8. [API Architecture](#8-api-architecture)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Route Map](#10-route-map)
11. [Testing & Quality](#11-testing--quality)
12. [DevOps & Infrastructure](#12-devops--infrastructure)
13. [Code Quality Findings](#13-code-quality-findings)
14. [Risk Assessment](#14-risk-assessment)
15. [Recommendations](#15-recommendations)

---

## 1. Executive Summary

**Welpco** is a neighborhood service marketplace connecting customers with service providers ("Welpers"). The platform is ~3 months old (first commit: Dec 6, 2025), has 34 commits, and is in active pre-launch development.

### Key Metrics

| Metric | Value |
|--------|-------|
| Total source files | ~803 |
| Lines of code (apps) | ~57,491 |
| Database entities | 22 |
| UI components | 152 files |
| Storybook stories | 132 files |
| Test files | 44 (17 E2E + 27 unit) |
| Test coverage (estimated) | ~5.7% |
| Open TODOs | 14 |
| `any` type usage | 9 instances |
| Console statements in prod | 21 files |
| Hardcoded secrets | 0 |
| Circular dependencies | 0 |

### Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript 5 |
| Backend | NestJS 11, TypeORM 0.3 |
| Database | PostgreSQL 16.6 |
| UI System | Radix UI Themes 3.2 + custom `@welpco/ui` |
| State | TanStack React Query 5 (server), Zustand 5 (client) |
| Forms | React Hook Form 7 + Zod 3 |
| Auth | JWT (Passport.js backend) + NextAuth v5 (frontend) |
| Monorepo | Turborepo + pnpm workspaces |
| Infrastructure | AWS CDK (scaffolded) |
| PWA | Serwist |

---

## 2. Project Overview

### What Welpco Does

Welpco is a two-sided marketplace for neighborhood services:

- **Customers** search for, discover, and book local service providers
- **Welpers** (service providers) create profiles, list offerings, set availability, and manage bookings
- **Guardians** can supervise minor accounts

### Core Business Domains

| Domain | Status | Description |
|--------|--------|-------------|
| User Management | Implemented | Registration, login, email verification, referrals, guardian accounts |
| Profile Management | Implemented | Customer/Welper profiles, service offerings, availability calendars |
| Content Management | Implemented | Service categories (3-level hierarchy), FAQs, static content, marketing phrases |
| Service Discovery | Implemented | Full-text search with PostgreSQL pg_trgm, geolocation, category filtering |
| Booking | Implemented | Full lifecycle: request → accept → confirm → in-progress → complete |
| Notifications | Implemented | In-app + email notifications with user preferences |
| Geocoding | Implemented | Google Maps integration for address resolution |
| Payments | Placeholder | Stripe keys configured but integration not built |
| Messaging | Mock | UI exists with mock data, no backend integration |

---

## 3. Monorepo Architecture

### Workspace Structure

```
welpco-monorepo/
├── apps/
│   ├── web/              # Next.js 16 frontend (port 8081)
│   ├── bff/              # NestJS 11 backend (port 3000)
│   └── design-system/    # Storybook 10 (port 6006)
├── packages/
│   ├── ui/               # Shared component library
│   ├── types/            # Shared TypeScript types
│   ├── shared/           # Shared utilities
│   ├── database/         # TypeORM config & base entities
│   ├── auth/             # Auth guards & strategies
│   └── events/           # Event definitions (in-process)
├── infrastructure/       # AWS CDK stacks
├── scripts/              # Dev setup & automation
├── docs/                 # Documentation & audits
└── bible/                # Reference materials
```

### Tooling

| Tool | Version | Purpose |
|------|---------|---------|
| pnpm | >=9.0.0 | Package manager |
| Turborepo | 2.6.1 | Build orchestration |
| TypeScript | 5.9.0 | Type system |
| Node.js | >=22.0.0 | Runtime |
| Docker Compose | - | PostgreSQL + MailHog |

### Turborepo Pipeline

```
build  → depends on ^build → outputs: dist/, .next/, build/
dev    → depends on ^build → no cache, persistent
test   → depends on build
lint   → no cache
```

### Service Ports

| Service | Port |
|---------|------|
| BFF (NestJS) | 3000 |
| Web (Next.js) | 8081 |
| Storybook | 6006 |
| PostgreSQL | 5432 |
| MailHog SMTP | 1025 |
| MailHog Web | 8025 |

---

## 4. Applications

### 4.1 Web App (`@welpco/web`)

**Framework:** Next.js 16 with App Router, React 19, TypeScript 5

**Architecture:**
- App Router with route groups: `(auth)`, `(dashboard)`
- Server components for auth checks, client components for interactivity
- API proxy layer for backend communication
- PWA with service worker (Serwist) and offline page

**Key Dependencies:**
- `@radix-ui/themes` — UI foundation
- `@tanstack/react-query` — Server state management
- `zustand` — Client state (auth, user, profile, personalization, UI stores)
- `react-hook-form` + `zod` — Form handling and validation
- `next-auth@5.0.0-beta.25` — Session management
- `lucide-react` — Iconography
- `date-fns` — Date formatting

**Provider Stack (root layout):**
```
html → body → SerwistProvider → QueryProvider → SessionProvider
  → AuthSessionSync → ThemeProvider → Suspense → children
```

### 4.2 BFF (`@welpco/bff`)

**Framework:** NestJS 11, TypeORM 0.3, PostgreSQL

**Architecture:** Domain-Driven Design (DDD)
- `domains/` — Business logic layer (entities, services, DTOs)
- `modules/` — API layer (controllers, module definitions)
- `common/` — Cross-cutting concerns (guards, interceptors, filters, decorators)

**Domains:**
```
domains/
├── user-management/     # Auth, users, referrals, email, admin, guardian
├── profile-management/  # Customer/Welper profiles, offerings, availability, favorites
├── content-management/  # Categories, questions, static content, FAQs, holidays
├── service-discovery/   # Full-text search, geolocation filtering
├── booking/             # Booking lifecycle & state machine
├── notification/        # In-app + email notifications
├── geocode/             # Google Maps geocoding
└── health/              # Health check endpoint
```

**Key Features:**
- Swagger/OpenAPI docs at `/api/docs`
- Helmet security headers
- Global validation pipe (class-validator + class-transformer)
- Structured logging interceptors
- CASL-based authorization
- In-process caching (cache-manager)

### 4.3 Design System (`@welpco/design-system`)

**Framework:** Storybook 10.1 with Vite 7, React 19

**Purpose:** Component documentation and visual testing

**Coverage:** 132 story files covering components, layout, platform features, and typography

**Add-ons:** `@storybook/addon-a11y` for accessibility testing

---

## 5. Shared Packages

| Package | Type | Purpose |
|---------|------|---------|
| `@welpco/ui` | ESM | Component library (152 files) — Radix UI wrappers + platform components |
| `@welpco/types` | CJS | Shared TypeScript interfaces (API responses, pagination, DTOs) |
| `@welpco/shared` | CJS | Shared utility functions |
| `@welpco/database` | CJS | TypeORM DataSource config, base entity class (id, createdAt, updatedAt) |
| `@welpco/events` | CJS | Event definitions for pub/sub (currently in-process, no message broker) |

NestJS JWT guards, strategies, and decorators for the BFF live in **`apps/bff/src/common/auth`** (not a separate workspace package).

### Package Dependency Graph

```
apps/web ──→ @welpco/ui, @welpco/types
apps/bff ──→ @welpco/database, @welpco/types, @welpco/events, @welpco/shared (+ in-app `src/common/auth`)
apps/design-system ──→ @welpco/ui
```

---

## 6. Design System

### 6.1 Foundation

The design system is built on **Radix UI Themes v3.2.1**, providing accessible, composable primitives. The `@welpco/ui` package wraps and extends these with Welpco-specific defaults and platform components.

### 6.2 Color System

**Brand Palette:**

| Token | Value | Usage |
|-------|-------|-------|
| Primary (accent) | Green (`green-9` to `green-11`) | Brand identity, CTAs, active states |
| Secondary | Blue (`blue-*`) | Information, links, default button color |
| Landing accent | Amber (`amber-9`) via `--brand-accent` | Landing page hero, highlights |
| Error/Destructive | Red | Form errors, delete actions |
| Neutral | Gray scale (`gray-1` to `gray-12`) | Text, backgrounds, borders |

**CSS Custom Properties:**
```css
--brand-accent: var(--amber-9);
--brand-accent-soft: var(--amber-3);
--brand-shadow-elevated: 0 24px 48px -12px var(--gray-a6), 0 12px 24px -8px var(--gray-a4);
--brand-shadow-glow: 0 0 40px -8px var(--green-6);
--brand-display-tracking: -0.04em;
```

**Semantic Color Mapping:**
- Blue → Information, primary actions
- Green → Success, confirmation, brand identity
- Red → Errors, destructive actions
- Gray → Disabled, secondary text
- Amber → Landing page accents only

**Dark Mode:** Fully supported via Radix Themes' `appearance` prop. Three modes: light, dark, system. Persisted to localStorage. All Radix color tokens auto-invert.

### 6.3 Typography

**Font Family:**
- Primary: **Geist** (loaded from Google Fonts via `next/font`)
- Monospace: **Geist Mono**
- CSS variables: `--font-geist-sans`, `--font-geist-mono`

**Type Scale (Radix size tokens):**

| Size | Approximate px | Usage |
|------|---------------|-------|
| 1 | 12px | Small captions, badges |
| 2 | 14px | Body text (default), form labels |
| 3 | 16px | Descriptions, larger body |
| 4 | 18px | Heading default |
| 5 | 20px | Section headings |
| 6 | 24px | Page headings |
| 7 | 28px | Hero sub-headings |
| 8 | 35px | Hero headings |
| 9 | 60px | Display text |

**Typography Components:**
- `Heading` — Semantic h1-h6, default size="4"
- `Text` — Body text, default size="2"
- `Strong`, `Em`, `Code`, `Quote`, `BlockQuote`, `Kbd` — Inline formatting
- `Link` — Anchor with Radix styling

**Display Type:** Uses `--brand-display-tracking: -0.04em` for tighter heading letter-spacing.

### 6.4 Spacing & Layout

**Space Scale:** Radix space tokens (`space-1` through `space-9`) applied via props:

```tsx
<Flex gap="3" px="4" py="5" />
// gap="3" ≈ 16px, px="4" ≈ 24px, py="5" ≈ 32px
```

**Common Patterns:**
- Section gaps: `gap="5"` or `gap="6"`
- Component gaps: `gap="3"` or `gap="4"`
- Page padding: `px="4"` (mobile), `px="6"` (desktop)

**Layout Components:**
- `Box` — Generic container
- `Flex` — Flexbox with direction, align, justify props
- `Grid` — CSS Grid with columns, rows props
- `Container` — Max-width constrained wrapper
- `Section` — Semantic section with padding
- `Inset` — Negative margin utility

### 6.5 Responsive Design

**Breakpoint System (mobile-first):**

| Breakpoint | Width | Token |
|-----------|-------|-------|
| Default | < 640px | `initial` |
| Small | 640px+ | `sm` |
| Medium | 768px+ | `md` |
| Large | 1024px+ | `lg` |
| XL | 1280px+ | `xl` |

**Responsive Props (Radix convention):**
```tsx
<Flex direction={{ initial: "column", md: "row" }}>
<Text size={{ initial: "2", md: "3" }}>
```

**Header Behavior:**
- Desktop (64px): Full search bar, text labels, icon group
- Mobile (56px): Collapsed search, icon-only buttons

### 6.6 Component Library

#### Primitive Components (Radix wrappers with Welpco defaults)

**Interactive:**
| Component | Default Props | Notes |
|-----------|--------------|-------|
| `Button` | variant="solid", color="blue", size="2" | Primary CTA |
| `IconButton` | variant="soft", size="2" | Icon-only actions |
| `Switch` | — | Toggle controls |
| `Checkbox` | — | Form checkboxes |
| `Radio` | — | Radio buttons |
| `Slider` | — | Range input |
| `SegmentedControl` | — | Toggle groups |

**Form:**
| Component | Notes |
|-----------|-------|
| `Input` | Text input with label + error support |
| `TextField` | Root + Slot subcomponents |
| `TextArea` | Multi-line, default rows=3 |
| `Select` | Root, Trigger, Content, Item, Group, Label, Separator |
| `CheckboxCards` | Card-style multi-select |
| `RadioCards` | Card-style single-select |
| `Label` | Form labels |

**Data Display:**
| Component | Default Props |
|-----------|--------------|
| `Badge` | variant="soft", color="blue" |
| `Avatar` | size="3" |
| `Table` | — |
| `DataList` | — |
| `Progress` | — |

**Feedback:**
| Component | Purpose |
|-----------|---------|
| `Spinner` | Loading indicator |
| `Skeleton` | Content placeholder |
| `Callout` | Alerts/notices |

**Overlay:**
| Component | Notes |
|-----------|-------|
| `Dialog` | Modal with title/description, close button |
| `AlertDialog` | Confirmation dialogs |
| `Popover` | Floating content |
| `HoverCard` | Hover-triggered content |
| `ContextMenu` | Right-click menus |
| `DropdownMenu` | Full menu system with submenus |

**Navigation:**
| Component | Notes |
|-----------|-------|
| `Tabs` | Root, List, Trigger, Content |
| `TabNav` | Root, Link subcomponents |

**Layout:**
| Component | Notes |
|-----------|-------|
| `Card` | Optional title/description, variant="surface" default |
| `Separator` | Horizontal dividers |
| `ScrollArea` | Scrollable regions |
| `AspectRatio` | Maintains ratios |

#### Platform Components (`packages/ui/src/platform/`)

High-level feature components composed from primitives:

**User Management:**
- `LoginForm`, `RegisterForm`, `PasswordReset`
- `AccountVerification`, `AccountTypeSelection`
- `InitialSetupWorkflow`, `EmailUpdateForm`
- `PasswordChangeForm`, `AccountDeletionForm`

**Booking & Scheduling:**
- `BookingForm`, `BookingCard`, `BookingCalendar`
- `RecurringBookingForm`, `ReminderCard`
- `BookingStatusBadge`, `CheckInOutButton`

**Communication:**
- `ChatInput`, `ConversationList`, `MessageBubble`
- `MessageThread`, `SupportForm`

**Service Discovery:**
- `SearchFiltersSidebar` (price, rating, distance filters)
- `ServiceCategoryCard`, `WelperProfileCard`
- `CategoryBrowser`, `SearchResultsList`

**Layout:**
- `CustomerHeader` (theme toggle, role switch, search, notifications)
- `WelperHeader`
- `Footer` (social links, company info)

**Payment & Dispute:**
- `PaymentProcessing` forms
- `DisputeForm`, `DisputeStatusBadge`
- `EvidenceUpload`, `SupportTicketCard`

### 6.7 Iconography

**Primary:** Lucide React (`lucide-react` v0.468.0) — 468+ SVG icons
**Secondary:** Radix UI Icons (`@radix-ui/react-icons` v1.3.2)

Common icons: `Bell`, `Search`, `ChevronDown`, `Settings`, `LogOut`, `Moon`, `Sun`, `Monitor`, `User`, `BookOpen`, `CheckCircle`

`IconButton` component with `aria-label` for accessibility. Touch targets enforced at 44px minimum via `size="3"`.

### 6.8 Animation & Motion

**Keyframe Animations (globals.css):**

| Animation | Duration | Usage |
|-----------|----------|-------|
| `floatIn` | — | Element entrance (opacity + scale up from 0.9) |
| `float` | — | Continuous hovering motion (translateY -10px) |
| `fadeInUp` | 0.6s ease-out | Fade with upward slide |
| `slideInLeft` / `slideInRight` | 0.6s ease-out | Horizontal entry |
| `scaleIn` | 0.5s ease-out | Scale entrance |
| `landingReveal` | staggered | Hero text reveal (0.05s–0.6s delays) |
| `landingFloatCard` | 9s ease-in-out | Continuous card float |
| `waterfallFall` | linear infinite | Card waterfall |
| `morphGradient` | 15s ease infinite | Background gradient morph |
| `floatBlob` | 12s ease-in-out | Blob shape drifting |
| `drift` | 20s ease-in-out | Parallax slow motion |

**Transition Patterns:**
- Card hover: `translateY(-6px) scale(1.01)` + elevated shadow, `cubic-bezier(0.22, 1, 0.36, 1)`
- Button hover: `translateY(-1px)` subtle lift
- Nav links: Scale underline from 0 to 100% width
- Color transitions: `0.2s ease`

### 6.9 Visual Identity

**Aesthetic:** Modern, accessible, editorial-meets-neighborhood

| Characteristic | Implementation |
|----------------|---------------|
| Typography | Geist font, generous spacing, tight display tracking |
| Colors | Green primary (growth/trust), gray neutrals, blue accents |
| Borders | Subtle `gray-3` to `gray-4`, rounded corners |
| Shadows | Minimal except on elevated/hover states |
| Motion | Smooth cubic-bezier, staggered reveals, bouncy transitions |
| Spacing | Generous breathing room (`gap-5` default for sections) |
| Components | Rounded, soft backgrounds, translucent variants |
| Glass effects | Landing page header with liquid glass morphism |

### 6.10 Accessibility

- Built on Radix UI primitives (ARIA roles, keyboard navigation, focus management out of the box)
- 40+ explicit `aria-label` / `role` attributes in custom components
- Storybook addon-a11y for automated accessibility audits
- `IconButton` components require `aria-label`
- Focus rings and keyboard navigation supported
- Semantic HTML elements (`nav`, `main`, `section`, `header`, `footer`)

---

## 7. Data Layer & Database

### 7.1 Technology

- **ORM:** TypeORM 0.3.28
- **Database:** PostgreSQL 16.6 (Docker)
- **Search:** PostgreSQL full-text search + `pg_trgm` extension

### 7.2 Base Entity

All entities extend a base class providing:
```typescript
id: UUID (primary key, auto-generated)
createdAt: timestamp (auto)
updatedAt: timestamp (auto-updated)
```

### 7.3 Entity Map

#### User Management

| Entity | Key Fields | Relations |
|--------|-----------|-----------|
| `UserAccount` | email (unique), passwordHash, accountType (CUSTOMER/WELPER/GUARDIAN), status (PENDING/ACTIVE/SUSPENDED/DEACTIVATED), emailVerified, lastLoginAt | → GuardianAccount, VerificationStatus, ReferralCode[], Referral[] |
| `EmailVerificationToken` | userId, token (unique), expiresAt, usedAt | → UserAccount |
| `VerificationStatus` | userId (unique), emailVerified, backgroundCheckStatus, identityVerified, verificationDate | → UserAccount |
| `GuardianAccount` | guardianUserId, minorUserId, relationshipType (PARENT/LEGAL_GUARDIAN/OTHER) | → UserAccount (x2) |
| `ReferralCode` | userId, code (unique), codeType (PERSONAL/CAMPAIGN), isActive, expiresAt | → UserAccount |
| `Referral` | referrerUserId, refereeUserId, referralCodeId, status, rewardStatus, rewardAmount | → UserAccount (x2), ReferralCode |

#### Profile Management

| Entity | Key Fields | Relations |
|--------|-----------|-----------|
| `CustomerProfile` | customerId (unique), firstName, lastName, phoneNumber (JSONB), address (JSONB), profileCompletionStatus, onboardingCompleted | → UserAccount |
| `WelperProfile` | welperId (unique), firstName, lastName, bio, profilePhotoUrl, serviceArea (GeoJSON), latitude, longitude, rating (decimal), reviewCount, profileVisibility | → UserAccount, AvailabilityCalendar[] |
| `ServiceOffering` | welperId, serviceCategoryId, serviceDescription, hourlyRate (decimal 10,2), experienceYears, subcategoryIds (JSONB), active | Indexed: welperId, serviceCategoryId, active |
| `AvailabilityCalendar` | welperId, dayOfWeek, startTime, endTime, recurringPattern, available | → WelperProfile, AvailabilityException[] |
| `AvailabilityException` | Overrides for specific dates | → AvailabilityCalendar |
| `FavoriteWelper` | Links customers to favorite welpers | — |

#### Content Management

| Entity | Key Fields |
|--------|-----------|
| `ServiceCategory` | name, description, parentId, level (1-3), displayOrder, icon, isActive |
| `Question` | questionText, questionType (text/select/checkbox/rating) |
| `ServiceQuestion` | serviceCategoryId, questionId, displayOrder, isRequired, conditionalLogic (JSONB) |
| `StaticContent` | key (unique), content, isActive |
| `FAQItem` | question, answer, category, displayOrder |
| `MarketingPhrase` | key, content, language |
| `Holiday` | Blocks unavailable dates |

#### Booking

| Entity | Key Fields |
|--------|-----------|
| `BookingRequest` | customerId, welperId, serviceOfferingId, answers (JSONB), status, scheduledDate, scheduledStartTime, scheduledEndTime, hourlyRate, totalPrice, address (JSONB), notes, cancellationReason, lifecycle timestamps |

**Booking State Machine (implemented):**
```
PENDING → ACCEPTED → IN_PROGRESS → COMPLETED → PAYMENT_RELEASED
    ↓         ↓            ↓
  DECLINED  CANCELLED    DISPUTED (also from completed / payment_released)
```

After Stripe **capture** succeeds (scheduler or webhook), the booking moves from `completed` to `payment_released`. The `no_show` status remains in the enum for legacy rows only until a dedicated welper action exists.

**Late cancellation fees** inside 24h of the scheduled start are logged but not charged in the current MVP.

Dispute resolution (`POST /api/disputes/:id/resolution`, Admin-only) moves the booking from `disputed` back to `completed` (default) or `cancelled` when support sets `bookingOutcome`, keeping the state machine consistent. Welper **check-out** is rejected unless the booking is `in_progress`, so a disputed booking cannot be completed without going through resolution.

**Dispute integration tests:** unit coverage in `booking-state-machine.spec.ts` and `dispute.service.spec.ts`. Run real DB + HTTP checks with `RUN_DISPUTE_E2E=1 pnpm exec jest --config ./test/jest-e2e.json dispute.e2e-spec` from `apps/bff` (requires Postgres, migrations, and seed users including `admin@welpco.local`).

#### Notifications

| Entity | Key Fields |
|--------|-----------|
| `Notification` | userId, channel, category, title, body, isRead, metadata (JSONB) |
| `NotificationPreference` | userId, channel, isEnabled |

### 7.4 Migrations

Located per-domain with timestamped naming:
- User Management: `1735689600000-AddOnboardingCompletedToUserAccount.ts`
- Booking: `20260203000001-CreateBookingRequestsTable.ts`, `20260206000001-AddBookingLifecycleColumns.ts`, `20260207000001-AddBookingTimezoneAndConfirmedAt.ts`, `20260403000001-RemoveConfirmedBookingStatus.ts`
- Content: `20260119000000-InitialContentManagementSchema.ts`

### 7.5 Seed Data

- Pre-seeded test accounts: customer, welper, e2e-customer
- Service categories and questions
- Quebec-based welper profiles for search demo
- Holiday definitions

---

## 8. API Architecture

### 8.1 Pattern

BFF (Backend for Frontend) pattern — the Next.js frontend communicates exclusively with the NestJS backend, which owns all business logic and database access.

### 8.2 API Endpoints

#### Authentication
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | Public | Register new account |
| POST | `/auth/login` | Public | Login, returns JWT pair |
| POST | `/auth/refresh` | Bearer | Refresh access token |
| POST | `/auth/verify-email` | Public | Verify email with token |
| POST | `/auth/request-password-reset` | Public | Send password reset email |
| POST | `/auth/reset-password` | Public | Reset password with token |

#### Profiles
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST/PATCH | `/profiles/customer` | Bearer | Customer profile CRUD |
| GET/POST/PATCH | `/profiles/welper` | Bearer | Welper profile CRUD |
| GET | `/profiles/:userId` | Public | Public profile view |

#### Service Offerings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST/PATCH | `/service-offerings` | Bearer | Manage offerings |

#### Availability
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET/POST/PATCH | `/availability` | Bearer | Manage calendar |

#### Bookings
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/bookings` | Bearer | Create booking request |
| GET | `/bookings` | Bearer | List bookings (filtered) |
| GET | `/bookings/:id` | Bearer | Booking detail |
| PATCH | `/bookings/:id/accept` | Bearer | Welper accepts |
| PATCH | `/bookings/:id/decline` | Bearer | Welper declines |
| PATCH | `/bookings/:id/cancel` | Bearer | Cancel booking |
| PATCH | `/bookings/:id/check-in` | Bearer | Start service |
| PATCH | `/bookings/:id/check-out` | Bearer | Complete service |

#### Search (Public)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/search/services` | Public | Search welpers/services |
| GET | `/search/categories` | Public | List categories |
| GET | `/search/welpers/:id` | Public | Public welper profile |

#### Content (Mostly Public)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/categories` | Public | Service categories |
| GET | `/content/:key` | Public | Static content |
| GET | `/health` | Public | Health check |

### 8.3 Validation

**Backend:** class-validator decorators on DTO classes
**Frontend:** Zod schemas with React Hook Form resolvers

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit, 1 special character

### 8.4 API Documentation

Swagger/OpenAPI available at `http://localhost:3000/api/docs` (auto-generated from NestJS decorators).

---

## 9. Authentication & Authorization

### 9.1 Flow

```
1. User registers → email verification token sent
2. User verifies email → token consumed
3. User logs in → JWT access token (15min) + refresh token (7d) returned
4. Frontend stores tokens in NextAuth session
5. API client auto-attaches Bearer token
6. On 401 → auto-refresh attempt → on failure → redirect to login
```

### 9.2 Backend Auth

| Component | Technology |
|-----------|-----------|
| JWT Strategy | Passport.js with `passport-jwt` |
| Token signing | `JWT_SECRET` / `JWT_REFRESH_SECRET` env vars |
| Password hashing | bcrypt |
| Route protection | `@UseGuards(JwtAuthGuard)` decorator |
| Role checks | `@Roles(AccountType.CUSTOMER)` + custom guard |
| Permissions | CASL v6 ability-based authorization |
| User injection | `@CurrentUser()` decorator extracts user from JWT |

### 9.3 Frontend Auth

| Component | Technology |
|-----------|-----------|
| Session management | NextAuth v5 (beta) |
| Token storage | NextAuth JWT callback |
| Auto-refresh | JWT callback checks expiry, calls `/auth/refresh` |
| API client | Auto-injects `Authorization: Bearer` header |
| Auth sync | `AuthSessionSync` component keeps stores in sync |

### 9.4 Account Types & Roles

| Type | Description |
|------|-------------|
| `CUSTOMER` | Books services |
| `WELPER` | Provides services |
| `GUARDIAN` | Supervises minor accounts |

---

## 10. Route Map

### Public Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, services, value proposition, CTA, footer |
| `/welper/[id]` | Public welper profile with offerings |
| `/search` | Redirects to `/dashboard/search` (backwards compatibility) |
| `/~offline` | PWA offline fallback |
| `/api/health` | Health check endpoint |

### Auth Routes (`(auth)` group)

| Route | Description |
|-------|-------------|
| `/login` | Email/password login with remember me |
| `/register` | Account type selection (customer vs welper) |
| `/register/customer` | Customer registration form |
| `/register/welper` | Welper registration with minor/guardian support |
| `/verification` | Email verification code entry |
| `/forgot-password` | Password reset request |
| `/reset-password` | New password entry (requires token) |
| `/onboarding-welcome` | Initial profile setup workflow |
| `/onboarding` | Alternative onboarding entry |
| `/onboarding/complete` | Onboarding success confirmation |
| `/example` | UI component playground (dev only) |

### Dashboard Routes (`(dashboard)` group — requires auth + onboarding)

| Route | Description |
|-------|-------------|
| `/dashboard` | Home page with overview and stats |
| `/dashboard/search` | Service discovery with filters, map, results |
| `/dashboard/profile` | User profile management |
| `/dashboard/bookings` | Booking list |
| `/dashboard/bookings/[id]` | Booking detail page |
| `/dashboard/booking/new` | Create new booking |
| `/dashboard/messages` | Messaging (mock data) |
| `/dashboard/notifications` | Notification preferences and history |
| `/dashboard/settings` | Account, appearance, notifications, privacy tabs |

### API Routes

| Route | Description |
|-------|-------------|
| `/api/auth/[...nextauth]` | NextAuth handlers |
| `/api/health` | Frontend health check |
| `/serwist/[path]` | Service worker routing |

---

## 11. Testing & Quality

### 11.1 Test Infrastructure

| Layer | Framework | Files | Type |
|-------|-----------|-------|------|
| Frontend E2E | Playwright 1.48 | 17 specs | Integration/E2E |
| Backend Unit | Jest 30 | 27 specs | Unit |
| Backend E2E | Jest (separate config) | Included in 27 | Integration |
| Infrastructure | Jest | CDK test config | Unit |
| Frontend Unit | **None** | 0 | — |

### 11.2 Coverage Analysis

**Estimated overall test coverage: ~5.7%** (44 test files / 771 source files)

- **Frontend:** 0% unit test coverage. 17 Playwright E2E specs cover auth, personalization, and profile flows.
- **Backend:** ~8.9% file-level coverage. Tests span auth, booking, profiles, and content domains.

### 11.3 E2E Test Suites

Playwright specs located in `apps/web/e2e/`:
- Authentication flows (`@auth` tag)
- Personalization settings
- Profile management

### 11.4 Linting & Formatting

| Tool | Config | Notes |
|------|--------|-------|
| ESLint 9 | Per-app configs (flat format) | Web: Next.js + Core Web Vitals rules |
| Prettier 3 | BFF only | No root-level config |
| TypeScript | `strict: true` (root, web) | BFF has relaxed: `noImplicitAny: false`, `strictPropertyInitialization: false` |

---

## 12. DevOps & Infrastructure

### 12.1 Local Development

**Docker Services:**
- PostgreSQL 16.6-alpine (with healthcheck)
- MailHog (SMTP testing at port 1025, web UI at port 8025)

**Setup Scripts:**
- `setup-dev.sh` — Full dev environment initialization
- `init-db.sh` / `reset-db.sh` — Database management
- `dev-zellij.sh` / `dev-tmux.sh` — Terminal workspace layouts

### 12.2 Infrastructure as Code

**AWS CDK** scaffolded in `/infrastructure/`:
- Database stack: TODO — RDS PostgreSQL not yet configured
- Infrastructure stack: TODO — Compute not yet defined
- CDK tests configured but stacks are placeholder

### 12.3 CI/CD

**Not yet implemented.** No `.github/workflows/`, no Vercel config, no deployment pipeline found.

### 12.4 Environment Configuration

Root `.env.example` provides:
- Database connection (PostgreSQL)
- JWT secrets (access + refresh)
- Stripe keys (placeholder)
- AWS region
- Sentry DSN (empty)
- CORS origin
- SMTP config (MailHog defaults)

---

## 13. Code Quality Findings

### 13.1 Strengths

| Area | Details |
|------|---------|
| Architecture | Clean DDD separation, proper domain boundaries, no circular dependencies |
| Type Safety | TypeScript strict mode in frontend, shared types package |
| Security | No hardcoded secrets, bcrypt for passwords, JWT with short expiry, Helmet headers |
| Component Design | Radix UI foundation provides accessibility by default, 152-file component library |
| State Management | Clean separation: React Query for server state, Zustand for client state |
| Validation | Dual validation: Zod on frontend, class-validator on backend |
| Error Handling | Try/catch in 33 files, error boundary component exists, NestJS exception filters |

### 13.2 Issues Found

#### High Priority

| Issue | Count | Details |
|-------|-------|---------|
| Low test coverage | ~5.7% | No frontend unit tests, minimal backend coverage |
| No CI/CD pipeline | — | No automated builds, tests, or deployments |
| Console statements in prod code | 21 files | `console.log`, `console.warn`, `console.error` in app code |
| Missing error.tsx pages | 0 files | No Next.js error boundaries at route level |
| NextAuth beta | v5.0.0-beta.25 | Using pre-release authentication library |

#### Medium Priority

| Issue | Count | Details |
|-------|-------|---------|
| Open TODOs | 14 | Including unimplemented API calls, admin role checks, payment integration |
| `any` type usage | 9 | In onboarding, search, and reset-password pages |
| BFF TypeScript relaxed | — | `noImplicitAny: false`, `strictPropertyInitialization: false` |
| Mock messaging | — | Messages page uses hardcoded mock data with no backend |
| No rate limiting | — | Only geocode service has rate limiting; API endpoints unprotected |
| Missing GIN indexes | — | TODO in search service for text search optimization |

#### Low Priority

| Issue | Count | Details |
|-------|-------|---------|
| No root Prettier config | — | Inconsistent formatting rules across apps |
| Wildcard imports | 6 | Can mask unused import detection |
| No loading states for all routes | — | Only 2 `loading.tsx` files (dashboard root, search) |

### 13.3 Unimplemented Features (per TODOs)

1. Payment processing (Stripe integration) — entity fields ready, no service
2. Admin role system — TODO in admin controller
3. Favorites API endpoints — frontend service stubs exist
4. Service preferences — TODO in profile page
5. Redis-based rate limiter — currently in-memory only
6. Real-time messaging — UI exists, no backend

---

## 14. Risk Assessment

### Technical Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| No CI/CD | High | Manual deployments prone to error; any push could break production |
| Low test coverage | High | Regressions likely as codebase grows; critical business logic untested |
| NextAuth beta dependency | Medium | Breaking changes possible on upgrade; API may shift before stable |
| No rate limiting on API | Medium | Susceptible to abuse; geocode service has it but main API doesn't |
| Single database, no read replicas | Low | Adequate for launch but needs planning for scale |
| In-process events (no message broker) | Low | @welpco/events package scaffolded but no external broker; limits scalability |

### Business Risks

| Risk | Severity | Notes |
|------|----------|-------|
| Payment not integrated | High | Cannot process payments; blocks monetization |
| No real-time messaging | Medium | UI implies messaging capability that doesn't exist |
| No file upload/storage | Medium | Profile photos URL field exists but no upload mechanism |
| Infrastructure not deployed | High | AWS CDK stacks are placeholder TODOs |

---

## 15. Recommendations

### Immediate (Pre-Launch)

1. **Implement CI/CD pipeline** — GitHub Actions with lint, type-check, test, build stages
2. **Integrate Stripe payments** — Entity fields and booking lifecycle already support it
3. **Add API rate limiting** — NestJS `@nestjs/throttler` for endpoint protection
4. **Remove console statements** — Replace with structured logging (already have NestJS Logger)
5. **Add route-level error.tsx** — At minimum in `(dashboard)` and `(auth)` groups
6. **Implement file upload** — S3/CloudFront for profile photos and documents

### Short-Term (Post-Launch)

7. **Increase test coverage to 60%+** — Add Vitest for frontend unit tests, expand Jest coverage for BFF
8. **Deploy infrastructure** — Complete AWS CDK stacks (RDS, ECS/Fargate, CloudFront)
9. **Add real-time messaging** — WebSocket integration with NestJS gateway
10. **Upgrade NextAuth to stable** — Monitor v5 stable release
11. **Standardize TypeScript strictness** — Enable `noImplicitAny` in BFF

### Medium-Term (Growth)

12. **Add monitoring & observability** — Complete Sentry integration, add APM
13. **Implement message broker** — Redis/SQS for event-driven architecture (replace in-process events)
14. **Add database read replicas** — For search performance at scale
15. **Implement caching strategy** — Redis for session storage, API caching
16. **Add comprehensive accessibility testing** — Automated a11y checks in CI

---

*Report generated from source code analysis of the Welpco monorepo. All findings are based on direct inspection of source files, configurations, and dependencies — not project documentation.*
