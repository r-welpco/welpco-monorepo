# SEO and AI Discovery Improvement Plan

Status: Planned for future implementation. No implementation is included with
this document.

## Goals

- Prioritize customer acquisition for local services.
- Preserve English and French discovery parity.
- Use established technical SEO as the foundation for search engines and
  answer engines.
- Publish only useful, factual marketplace pages backed by real supply.
- Protect minors, private profiles, user-state pages, and precise location
  data from indexing.

## Technical Foundation

- Standardize `https://www.welpco.com` as the production origin for metadata,
  canonicals, Open Graph URLs, robots, and sitemaps.
- Generate self-referencing canonicals and reciprocal `en`, `fr`, and
  `x-default` alternates for every bilingual page.
- Render the correct document language server-side without introducing a
  root-layout dynamic-data dependency. Redirect `/en/...` to the canonical
  unprefixed English URL.
- Mark dashboard, login, registration, verification, password-reset,
  guardian, and faceted `/search` pages `noindex`.
- Remove `/search` from sitemaps. Keep it as the interactive product search,
  not an organic landing page.
- Split sitemaps into static pages, blog posts, service/location pages, and
  eligible profiles.
- Use source or database `updatedAt` values rather than fixed sitemap dates.
- Include all published blog posts, guides, and legal pages.
- Add truthful JSON-LD:
  - `Organization` and `WebSite` on the homepage.
  - `Service`, `ItemList`, and `BreadcrumbList` on service pages.
  - `ProfilePage` and `Person` on eligible Welper pages.
  - `BlogPosting` on articles.
  - `FAQPage` only where the same questions and answers are visibly rendered.
- Audit payment authorization/capture wording, payout timing,
  background-check claims, and unavailable guardian functionality before
  expanding indexing.

## Category Slugs and SEO Catalog

- Add a unique, stable ASCII `slug` to service categories.
- Backfill every parent and subcategory with deterministic slugs.
- Keep slugs stable when display names change unless an administrator
  explicitly performs a managed slug migration.
- Add a privacy-safe public SEO catalog endpoint containing:
  - Active category IDs, slugs, hierarchy, names, descriptions, and update
    timestamps.
  - Eligible adult Welper counts by service, normalized city, province, and
    country.
  - Current listed price ranges.
  - City slugs and aggregate centroids.
- Never expose individual coordinates, postal codes, addresses, minor counts,
  access tokens, booking data, or payment data through the catalog.
- Do not return an aggregate centroid for a bucket where it could reveal one
  person's coordinates.

## Service and Location Pages

- Add bilingual routes using the same category slug:
  - `/services/[serviceSlug]`
  - `/services/[serviceSlug]/[cityProvinceSlug]`
  - `/fr/services/[serviceSlug]`
  - `/fr/services/[serviceSlug]/[cityProvinceSlug]`
- Maintain reviewed English and French explanatory copy and service-specific
  FAQs keyed by stable slug.
- Do not generate generic city paragraphs solely for rankings.
- Publish a service/location page only when at least three eligible adult
  Welpers are available.
- Below the threshold, omit the URL from sitemaps and render
  `noindex,follow`, linking to the broader service page.
- Server-render:
  - Factual eligible-supply count.
  - Current listed price range with a clear non-guaranteed-quote disclaimer.
  - Service explanation and booking process.
  - Truthful trust information.
  - Up to twelve eligible Welper summaries.
- Revalidate marketplace-backed pages hourly.
- Link homepage categories and internal navigation to landing pages rather
  than only expanding client-side lists.

## Public Welper Profiles

- Refactor public Welper pages so meaningful profile and offering content is
  present in initial server HTML.
- Index a profile only when the Welper:
  - Has a confirmed date of birth and is at least 18.
  - Uses Public profile visibility.
  - Has an active account.
  - Has completed signup and verified email.
  - Has a complete profile.
  - Has at least one active service offering.
- Use `/w/[handle]` as canonical when a handle exists; otherwise use
  `/welper/[id]`.
- Permanently redirect the UUID route to the handle route after a handle is
  claimed.
- Keep minors out of all sitemaps and marked `noindex`.
- Continue returning 404 for Private or otherwise ineligible profiles.
- Update profile visibility and signup disclosures to explain that eligible
  Public adult profiles may appear in search engines and AI answers.

## Agent Discovery

- Explicitly allow public search/retrieval crawlers:
  - `OAI-SearchBot`
  - `ChatGPT-User`
  - `Claude-SearchBot`
  - `Claude-User`
  - `PerplexityBot`
  - `Perplexity-User`
- Block model-training crawlers:
  - `GPTBot`
  - `ClaudeBot`
  - `Google-Extended`
  - `CCBot`
  - `Bytespider`
- Document that blocking `Google-Extended` also opts out of Gemini-app
  grounding, while ordinary Google Search and its generative search features
  remain governed by Googlebot.
- Add a concise `/llms.txt` convenience index linking canonical service,
  guide, policy, and contact pages.
- Do not add agent booking/payment actions, an agent API, or an MCP server in
  this phase.

## Indexing and Measurement

- Verify the domain in Google Search Console and Bing Webmaster Tools.
- Submit the sitemap index to both tools.
- Configure IndexNow for changed service and profile URLs.
- Keep Search Console as the primary source for indexing and search-query
  diagnostics.
- Use Vercel Analytics for privacy-safe events:
  - Organic landing CTA.
  - Registration start.
  - Search start.
  - Booking start.
- Event properties may contain locale, service slug, city slug, and a coarse
  referrer category.
- Do not record postal codes, profile IDs, booking IDs, or raw search text.
- Report:
  - Google and Bing impressions.
  - Indexed canonical URLs.
  - Organic conversions.
  - ChatGPT, Claude, and Perplexity referrals.
  - Crawler and sitemap errors.
  - Landing-page conversion by service and city.

## Verification

- Test canonical host, self-canonicals, hreflang reciprocity, server-rendered
  language, `/en` redirects, `noindex`, and user-agent-specific robots rules.
- Test catalog eligibility for adults, minors, Private profiles, inactive
  accounts, incomplete signup, unverified email, missing birth dates, and the
  three-Welper publication threshold.
- Assert that all sitemap entries are canonical URLs returning HTTP 200.
- Assert that all published articles, indexable service pages, and eligible
  profiles appear in exactly the intended sitemap.
- Verify page meaning using raw HTML requests with JavaScript disabled.
- Validate JSON-LD with Schema Markup Validator and Google Rich Results Test.
- Add Playwright coverage for bilingual service/location pages, profile
  canonical redirects, privacy controls, and search calls to action.
- Add Lighthouse CI budgets for SEO, accessibility, LCP, and CLS.
- Monitor production field data through Speed Insights.

## Rollout

1. Correct canonical, language, noindex, robots, sitemap, and factual content.
2. Deploy the category-slug migration and SEO catalog.
3. Deploy service and supply-gated city pages behind `noindex` for content
   review.
4. Enable service-page indexing.
5. Notify Welpers about public indexing, then enable indexing for eligible
   adult Public profiles.
6. Submit sitemaps and IndexNow updates.
7. Monitor indexing, crawler errors, referrals, and conversion for at least
   30 days.

## Defaults

- Customer acquisition comes first.
- English and French have content parity.
- City coverage is nationwide and supply-gated.
- Three eligible adults are required for an indexable service/location page.
- Eligible adult Public profiles are indexed; Private remains the opt-out.
- Search/retrieval crawlers are allowed and training crawlers are blocked.
- No transactional agent capabilities are included.

