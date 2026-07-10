# Content Management Domain

> Last verified: 2026-07-03 · commit de88bd4 · generated from implementation

Root: `apps/bff/src/domains/content-management/`

## Purpose
Platform reference content: the service-category taxonomy, intake questions and their per-category assignments, static pages, FAQ items, marketing phrases, and a holiday table. Reads are public; writes are Admin-only.

## Entities (`entities/`)

| Entity | Table | Key fields | Enums |
|---|---|---|---|
| `ServiceCategory` | `service_categories` | name, description, parentId (self-referencing tree), level, displayOrder, icon, isActive | — |
| `Question` | `questions` | type, text, placeholder, helpText, validationRules (jsonb), options (jsonb), entityType, displayOrder | `QuestionType`: text, number, date, time, choice, boolean, entity_reference · `EntityType`: child, person, pet |
| `ServiceQuestion` | `service_questions` | serviceCategoryId, questionId, displayOrder, isRequired, conditionalLogic (jsonb) | — |
| `StaticContent` | `static_content` | contentType, title, body, version, isPublished, publishedDate | `ContentType`: about_us, faq, terms, privacy, contact, homepage |
| `FAQItem` | `faq_items` | category, question, answer, displayOrder, isActive | `FAQCategory`: customer, welper, general |
| `MarketingPhrase` | `marketing_phrases` | phraseText, phraseType, usageContext, isActive | `PhraseType`: cta, slogan, tagline |
| `Holiday` | `holidays` | countryCode, provinceCode, name, date | — |

## Services
One CRUD service per sub-module: `CategoriesService`, `QuestionsService`, `ServiceQuestionsService`, `StaticContentService`, `FaqItemsService`, `MarketingPhrasesService`, `HolidayService` (query by country/province; no controller — consumed by other services), plus a stub `EventPublisherService` and a hello-world `AppService`/`AppController` (`GET /api`).

## API endpoints (prefix `api`)

Pattern is identical across resources: **GET routes public, mutations `JwtAuthGuard + RolesGuard @Roles('Admin')`**.

| Resource | Public GET | Admin mutations |
|---|---|---|
| categories | /api/categories, /api/categories/parent/:parentId, /api/categories/:id | POST/PUT/DELETE /api/categories(/:id) |
| questions | /api/questions, /api/questions/type/:type, /api/questions/:id | POST/PUT/DELETE /api/questions(/:id) |
| service-questions | /api/service-questions/service/:serviceCategoryId, /api/service-questions/:id | POST/PUT/DELETE /api/service-questions(/:id) |
| static-content | /api/static-content, /api/static-content/type/:contentType, /api/static-content/:id | POST/PUT/DELETE /api/static-content(/:id) |
| faq-items | /api/faq-items, /api/faq-items/:id | POST/PUT/DELETE /api/faq-items(/:id) |
| marketing-phrases | /api/marketing-phrases, /api/marketing-phrases/:id | POST/PUT/DELETE /api/marketing-phrases(/:id) |

Also: `GET /api/health` (`health/health.controller.ts`, duplicate of other domains' health paths) and a read-only aggregate facade at `apps/bff/src/modules/content/content.controller.ts` (`/api/content/categories…`, `/api/content/questions…`, `/api/content/service-questions/:serviceCategoryId`, `/api/content/static-content…`, `/api/content/holidays`).

## Scheduled jobs
None.

## External integrations
None. Taxonomy is seeded/synced via migration `migrations/20260516000001-SyncServiceCategoryTaxonomy.ts`.

## Cross-domain dependencies
Imports only `common/auth`. Consumed by service-discovery (categories), job-posting (category labels, service questions), booking, and profile-management flows.

## Key files
- `content-management.module.ts`
- `categories/categories.service.ts`, `entities/service-category.entity.ts`
- `service-questions/service-questions.service.ts`, `holiday/holiday.service.ts`
- Facade: `apps/bff/src/modules/content/content.controller.ts`
