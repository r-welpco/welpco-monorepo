/**
 * Integration test script: search for welpers by postal code H1M3C3 and
 * subcategory "Dog Walks", and assert that the expected welper (e.g. welper_demo@demo.com) is returned.
 *
 * Prerequisites:
 * - BFF running (e.g. pnpm dev) and reachable at BFF_URL
 * - Expected welper has profile_completion_status = Complete, profile_visibility = Public,
 *   service area covering H1M3C3, and at least one active offering in the "Dog Walks" subcategory
 *
 * Usage:
 *   cd apps/bff
 *   pnpm run test:search-welper-demo
 *
 * Optional env:
 *   BFF_URL=http://localhost:3000     (default)
 *   EXPECTED_WELPER_EMAIL=welper_demo@demo.com   (resolve to welperId via DB and assert they appear)
 *   SEARCH_CATEGORY_ID=<uuid>   (subcategory id for filter; if set, skips lookup by name)
 *   DB_* (for DB lookup when EXPECTED_WELPER_EMAIL is set; same as .env)
 */

import { config } from 'dotenv';
import { join } from 'path';
import { Client } from 'pg';

// Load env from BFF root
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../../.env.local') });

const BFF_URL = (process.env.BFF_URL || 'http://localhost:3000').replace(/\/$/, '');
const EXPECTED_WELPER_EMAIL = process.env.EXPECTED_WELPER_EMAIL || 'welper_demo@demo.com';
const SEARCH_CATEGORY_ID = process.env.SEARCH_CATEGORY_ID?.trim();

const SEARCH_POSTAL = 'H1M3C3';
const SEARCH_COUNTRY = 'CA';
/** Subcategory name for filter when SEARCH_CATEGORY_ID is not set */
const CATEGORY_NAME_DOG_WALKS = 'Dog Walks';

async function getWelperIdByEmail(email: string): Promise<string | null> {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'welpco',
    password: process.env.DB_PASSWORD || 'welpco_dev',
    database: process.env.DB_DATABASE || 'welpco_dev',
  });
  await client.connect();
  try {
    const res = await client.query<{ id: string }>(
      `SELECT id FROM user_accounts WHERE email = $1 AND account_type = $2 LIMIT 1`,
      [email, 'Welper'],
    );
    return res.rows[0]?.id ?? null;
  } finally {
    await client.end();
  }
}

async function getCategories(): Promise<{ id: string; name: string }[]> {
  const res = await fetch(`${BFF_URL}/api/search/categories`);
  if (!res.ok) throw new Error(`GET /api/search/categories failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<{ id: string; name: string }[]>;
}

async function searchServices(params: {
  postalCode: string;
  countryCode: string;
  q?: string;
  categoryId?: string;
}): Promise<{ items: { welperId: string }[]; total: number; page: number; limit: number }> {
  const url = new URL(`${BFF_URL}/api/search/services`);
  url.searchParams.set('postalCode', params.postalCode);
  url.searchParams.set('countryCode', params.countryCode);
  if (params.q) url.searchParams.set('q', params.q);
  if (params.categoryId) url.searchParams.set('categoryId', params.categoryId);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`GET /api/search/services failed: ${res.status} ${res.statusText}`);
  return res.json() as Promise<{
    items: { welperId: string }[];
    total: number;
    page: number;
    limit: number;
  }>;
}

function findCategoryIdByName(
  categories: { id: string; name: string }[],
  name: string,
): string | null {
  const found = categories.find((c) => c.name === name);
  return found?.id ?? null;
}

async function main(): Promise<void> {
  console.log('Search Welper Demo Test');
  console.log('  BFF_URL:', BFF_URL);
  console.log('  Postal:', SEARCH_POSTAL, 'Country:', SEARCH_COUNTRY);
  console.log('  Expected welper email:', EXPECTED_WELPER_EMAIL);

  let expectedWelperId: string | null = null;
  if (EXPECTED_WELPER_EMAIL) {
    console.log('  Resolving welper id from DB...');
    expectedWelperId = await getWelperIdByEmail(EXPECTED_WELPER_EMAIL);
    if (!expectedWelperId) {
      console.error(`  ❌ No welper found in DB with email: ${EXPECTED_WELPER_EMAIL}`);
      process.exit(1);
    }
    console.log('  Expected welper id:', expectedWelperId);
  }

  let categoryId: string;
  if (SEARCH_CATEGORY_ID) {
    categoryId = SEARCH_CATEGORY_ID;
    console.log('  Using category id (from SEARCH_CATEGORY_ID):', categoryId);
  } else {
    console.log('  Fetching categories...');
    const categories = await getCategories();
    const found = findCategoryIdByName(categories, CATEGORY_NAME_DOG_WALKS);
    if (!found) {
      console.error('  ❌ Category "' + CATEGORY_NAME_DOG_WALKS + '" not found. Available:', categories.map((c) => c.name).slice(0, 20));
      process.exit(1);
    }
    categoryId = found;
    console.log('  Using category id:', categoryId, '(' + CATEGORY_NAME_DOG_WALKS + ')');
  }

  console.log('  Calling search API (postal + category, no text search)...');
  const result = await searchServices({
    postalCode: SEARCH_POSTAL,
    countryCode: SEARCH_COUNTRY,
    categoryId,
  });

  console.log('  Result: total=', result.total, 'page=', result.page, 'limit=', result.limit);

  if (!Array.isArray(result.items)) {
    console.error('  ❌ Response items is not an array');
    process.exit(1);
  }

  if (result.items.length === 0 && result.total > 0) {
    console.error('  ❌ No items on this page (total > 0)');
    process.exit(1);
  }

  if (expectedWelperId) {
    const found = result.items.some((i) => i.welperId === expectedWelperId);
    if (!found) {
      const ids = result.items.map((i) => i.welperId);
      console.error(
        `  ❌ Expected welper ${EXPECTED_WELPER_EMAIL} (id ${expectedWelperId}) not in results. Welper ids in response:`,
        ids.length ? ids : '(none)',
      );
      process.exit(1);
    }
    console.log(`  ✅ Welper ${EXPECTED_WELPER_EMAIL} found in search results.`);
  } else {
    console.log('  ✅ Search returned', result.items.length, 'result(s).');
  }

  console.log('  All assertions passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('  ❌', err);
  process.exit(1);
});
