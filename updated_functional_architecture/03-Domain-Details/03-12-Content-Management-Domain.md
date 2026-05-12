# Content Management Domain

> **Status**: Implemented
> **Classification**: Supporting
> **Priority**: High
> **Module**: `domains/content-management/`

## Purpose

Manages the platform's foundational content: hierarchical service categories, a reusable question library for service-specific booking forms, static content (terms, privacy policy, marketing copy), FAQ items, marketing phrases, and holiday calendars by country and province. This is a foundational domain that other domains depend on for category definitions and content display.

## Core Capabilities

### 1. Hierarchical Service Categories

- Two-level hierarchy: **parent category** → **subcategories**
- Each category has: name, description, icon URL, display order, active flag
- Main categories include: Care, Pet Care, Education, In-Home Maintenance, Exterior Maintenance, Health & Wellness, Entertainment
- Categories are used by: Service Discovery (search filters), Profile Management (service offerings), Job Posting (job categorization)

### 2. Question Library System

A reusable question bank that enables dynamic booking forms per service category.

**Question types**:

| Type | Widget | Example |
|---|---|---|
| `text` | Text input | "Any special instructions?" |
| `number` | Numeric input | "How many dogs?" |
| `date` | Date picker | "When do you need the service?" |
| `time` | Time picker | "Preferred start time?" |
| `choice` | Radio/dropdown | "Size of each dog: Small / Medium / Large" |
| `boolean` | Checkbox | "Is this a one-time service?" |
| `entity_reference` | Dynamic entity form | "Add a child" (creates a child entity with name, age, allergies) |

**Question features**:
- Validation rules: `required`, `min`, `max`, `pattern` (regex)
- Options: for `choice` type, stored as a JSON array
- Entity types: for `entity_reference`, defines what entity can be added (`child`, `person`, `pet`)
- Help text: optional guidance shown below the field
- Placeholder text: shown inside the input

### 3. Service Questions (Link Table)

- Links questions to service categories with:
  - `displayOrder`: controls the order questions appear on the booking form
  - `isRequired`: whether the question must be answered
  - `conditionalLogic`: JSON rules (e.g., show question B if question A's answer equals "yes")
- A single question can be linked to multiple categories (reuse)
- Shared questions (date, time, recurring, notes) appear on all service booking forms
- Service-specific questions are linked only to relevant categories

### 4. Static Content

- Content types: `AboutUs`, `TermsOfService`, `PrivacyPolicy`, `ContactUs`, `HomepageHero`, `HowItWorks`
- Each content item has a `contentType` key, title, HTML body, and published status
- Content is versioned — updates create new versions while preserving history
- Unpublished content is not visible to public users

### 5. FAQ Items

- Categorized by audience: `Customer`, `Welper`, `General`
- Each FAQ has: question, answer (HTML), display order, active flag
- FAQs are displayed on the help/FAQ page grouped by audience

### 6. Marketing Phrases

- Short text snippets used in the UI: CTAs, slogans, taglines
- Each phrase has a `usageContext` (Homepage, Registration, SearchPage, etc.)
- Active/inactive flag for easy toggling

### 7. Holidays

- Holidays by country and province (e.g., Canada → Quebec → Saint-Jean-Baptiste Day)
- Used for availability validation and scheduling
- Fields: name, date, country, province (nullable for national holidays), recurring flag

## Data Entities

### ServiceCategory

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `varchar(100)` | Not null |
| `description` | `text` | Nullable |
| `parentCategoryId` | `uuid` | FK → `ServiceCategory.id`, nullable (null = top-level) |
| `level` | `integer` | 1 (parent) or 2 (subcategory) |
| `iconUrl` | `varchar(500)` | Nullable |
| `displayOrder` | `integer` | For UI ordering |
| `isActive` | `boolean` | Default `true` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### Question

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `questionType` | `enum` | `text`, `number`, `date`, `time`, `choice`, `boolean`, `entity_reference` |
| `label` | `varchar(255)` | Not null (the question text) |
| `placeholderText` | `varchar(255)` | Nullable |
| `helpText` | `text` | Nullable |
| `validationRules` | `jsonb` | `{ required?: boolean, min?: number, max?: number, pattern?: string }` |
| `options` | `jsonb` | For `choice` type: `[{ value: string, label: string }]` |
| `entityType` | `enum` | `child`, `person`, `pet`, nullable (for `entity_reference` type) |
| `displayOrder` | `integer` | Default ordering |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### ServiceQuestion (Link Table)

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `serviceCategoryId` | `uuid` | FK → `ServiceCategory.id` |
| `questionId` | `uuid` | FK → `Question.id` |
| `displayOrder` | `integer` | Order within the service form |
| `isRequired` | `boolean` | Default `false` |
| `conditionalLogic` | `jsonb` | Nullable. `{ showIf: { questionId: uuid, equals: value } }` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

**Unique constraint**: `(serviceCategoryId, questionId)`

### StaticContent

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `contentType` | `enum` | `AboutUs`, `TermsOfService`, `PrivacyPolicy`, `ContactUs`, `HomepageHero`, `HowItWorks` |
| `title` | `varchar(255)` | Not null |
| `body` | `text` | HTML content |
| `version` | `integer` | Auto-incremented on update |
| `isPublished` | `boolean` | Default `false` |
| `publishedAt` | `timestamptz` | Nullable |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### FaqItem

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `audience` | `enum` | `Customer`, `Welper`, `General` |
| `question` | `varchar(500)` | Not null |
| `answer` | `text` | HTML content |
| `displayOrder` | `integer` | |
| `isActive` | `boolean` | Default `true` |
| `createdAt` | `timestamptz` | Auto |
| `updatedAt` | `timestamptz` | Auto |

### MarketingPhrase

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `phraseText` | `text` | Not null |
| `phraseType` | `enum` | `CTA`, `Slogan`, `Tagline` |
| `usageContext` | `varchar(100)` | e.g., `Homepage`, `Registration`, `SearchPage` |
| `isActive` | `boolean` | Default `true` |
| `createdAt` | `timestamptz` | Auto |

### Holiday

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | PK |
| `name` | `varchar(200)` | Not null |
| `date` | `date` | Not null |
| `country` | `varchar(2)` | ISO 3166-1 alpha-2 (e.g., `CA`) |
| `province` | `varchar(50)` | Nullable (null = national holiday) |
| `isRecurring` | `boolean` | `true` if same date every year |
| `createdAt` | `timestamptz` | Auto |

## API Endpoints

All prefixed with `/api/content`.

### Categories

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/categories` | Public | List all active categories (hierarchical). |
| `GET` | `/content/categories/:id` | Public | Get a single category with subcategories. |
| `POST` | `/content/categories` | Admin | Create a category. |
| `PATCH` | `/content/categories/:id` | Admin | Update a category. |
| `DELETE` | `/content/categories/:id` | Admin | Soft-delete (deactivate) a category. |

### Questions

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/questions` | Public | List all questions. |
| `GET` | `/content/questions/:id` | Public | Get a question by ID. |
| `POST` | `/content/questions` | Admin | Create a question. |
| `PATCH` | `/content/questions/:id` | Admin | Update a question. |
| `DELETE` | `/content/questions/:id` | Admin | Delete a question. |

### Service Questions (Linking)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/service-questions/category/:categoryId` | Public | Get questions for a service category (ordered, with conditional logic). |
| `POST` | `/content/service-questions` | Admin | Link a question to a category. |
| `PATCH` | `/content/service-questions/:id` | Admin | Update link (order, required, conditional logic). |
| `DELETE` | `/content/service-questions/:id` | Admin | Remove a question from a category. |

### Static Content

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/static-content` | Public | List all published static content. |
| `GET` | `/content/static-content/type/:type` | Public | Get content by type (e.g., `TermsOfService`). |
| `POST` | `/content/static-content` | Admin | Create static content. |
| `PATCH` | `/content/static-content/:id` | Admin | Update content (creates new version). |

### Holidays

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/content/holidays` | Public | List holidays. Filters: `country`, `province`, `year`. |
| `POST` | `/content/holidays` | Admin | Create a holiday. |
| `PATCH` | `/content/holidays/:id` | Admin | Update a holiday. |
| `DELETE` | `/content/holidays/:id` | Admin | Delete a holiday. |

## Business Rules

1. **Category hierarchy**: max 2 levels deep (parent → child). A subcategory must have a `parentCategoryId` pointing to a level-1 category.
2. **Deactivating a parent category**: also hides all its subcategories from search and service offerings. Existing offerings linked to deactivated categories remain but are excluded from new search results.
3. **Question reuse**: questions are defined once in the library and linked to multiple categories via `ServiceQuestion`. Updating a question's label updates it everywhere it's used.
4. **Conditional logic**: `showIf` rules reference another question's ID and expected value. The frontend evaluates these rules to show/hide questions dynamically.
5. **Entity reference questions**: when `questionType = 'entity_reference'`, the frontend renders a dynamic form to add entities (e.g., "Add child" with fields: name, age, allergies). The `entityType` field determines which entity form to render.
6. **Static content versioning**: updating static content increments the version number. Previous versions are preserved for rollback.
7. **Holidays**: used by the Booking & Scheduling domain to warn about holiday availability. Holidays do not automatically block bookings — they serve as informational flags.
8. **Admin-only mutations**: all create/update/delete operations on content require admin role. Public users can only read.

## Integration Points

| Direction | Domain | Interaction |
|---|---|---|
| **Consumed by** | Service Discovery | Category tree for search filters and browsing |
| **Consumed by** | Profile Management | Categories for Welper service offerings |
| **Consumed by** | Job Posting & Matching | Categories for job posting categorization |
| **Consumed by** | Booking & Scheduling | Service questions for booking forms; holidays for scheduling |
| **Consumed by** | User Management | Terms of Service and Privacy Policy during registration |

This is a foundational domain — it does not depend on any other Welpco domain.

## Security Considerations

- Public read endpoints do not require authentication
- All write operations require admin role (enforced by `@CheckPolicies()` and `PoliciesGuard`)
- HTML content in static pages and FAQ answers is sanitized server-side to prevent XSS
- Question conditional logic JSON is validated against a schema before persistence

## Implementation Notes

- The `ContentManagementModule` is one of the first modules bootstrapped and has no domain dependencies
- Categories are seeded via database seed scripts in `database/seeds/` with the full Welpco category hierarchy
- Questions and service-question links are also seeded for the initial set of services
- The category tree is cached in-memory on first load and invalidated when a category is created/updated/deleted
- Content versioning uses a simple integer counter (not a separate versions table — the current content is the latest version, previous versions are logged)
