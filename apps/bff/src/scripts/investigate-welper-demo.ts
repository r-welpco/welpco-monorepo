/**
 * One-off: inspect welper_demo@demo.com profile and offerings to see why they
 * don't appear in search for H1M3C3 + "dogs walk".
 */
import { config } from 'dotenv';
import { join } from 'path';
import { Client } from 'pg';

config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../../.env.local') });

const EMAIL = 'welper_demo@demo.com';
const WELPER_ID = '9ecf1948-a614-4eb0-8343-84071a2a8477';

async function main() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USERNAME || 'welpco',
    password: process.env.DB_PASSWORD || 'welpco_dev',
    database: process.env.DB_DATABASE || 'welpco_dev',
  });
  await client.connect();

  try {
    const profile = await client.query(
      `SELECT welper_id, first_name, last_name, profile_completion_status, profile_visibility,
              latitude, longitude, service_area, bio
       FROM welper_profiles WHERE welper_id = $1`,
      [WELPER_ID],
    );
    const offerings = await client.query(
      `SELECT so.id, so.service_category_id, so.service_description, so.active, sc.name as category_name
       FROM service_offerings so
       LEFT JOIN service_categories sc ON sc.id = so.service_category_id
       WHERE so.welper_id = $1`,
      [WELPER_ID],
    );

    console.log('--- Profile ---');
    if (profile.rows.length === 0) {
      console.log('No welper_profiles row for welper_id', WELPER_ID);
      return;
    }
    const p = profile.rows[0];
    console.log('welper_id:', p.welper_id);
    console.log('first_name:', p.first_name, 'last_name:', p.last_name);
    console.log('profile_completion_status:', p.profile_completion_status, '(need: Complete)');
    console.log('profile_visibility:', p.profile_visibility, '(need: Public)');
    console.log('latitude:', p.latitude, 'longitude:', p.longitude);
    console.log('service_area:', JSON.stringify(p.service_area, null, 2));
    console.log('bio (first 200 chars):', (p.bio || '').slice(0, 200));

    console.log('\n--- Service offerings ---');
    if (offerings.rows.length === 0) {
      console.log('No service_offerings for this welper');
    } else {
      for (const o of offerings.rows) {
        console.log('- category:', o.category_name, '| active:', o.active);
        console.log('  description (first 150):', (o.service_description || '').slice(0, 150));
      }
    }

    const qPattern = '%dogs walk%';
    const textMatch =
      (p.first_name && String(p.first_name).toLowerCase().includes('dogs walk')) ||
      (p.last_name && String(p.last_name).toLowerCase().includes('dogs walk')) ||
      (p.bio && String(p.bio).toLowerCase().includes('dogs walk')) ||
      offerings.rows.some(
        (o) => o.service_description && String(o.service_description).toLowerCase().includes('dogs walk'),
      );
    console.log('\n--- Text search "dogs walk" ---');
    console.log('Query uses ILIKE', qPattern, '(exact phrase)');
    console.log('Matches profile/offerings?', textMatch);

    const catIdUsed = 'eb12643c-f497-46a0-aaf5-3ada82edaa2d';
    const hasCategory = offerings.rows.some(
      (o) => o.active && (o.service_category_id === catIdUsed || o.category_name?.toLowerCase().includes('dog') || o.category_name?.toLowerCase().includes('pet')),
    );
    console.log('\n--- Category filter (Pet/Dog category id used by test) ---');
    console.log('categoryId used in search:', catIdUsed);
    console.log('Welper has active offering in Pet/Dog category?', hasCategory);
    console.log('Welper category ids:', offerings.rows.filter((r) => r.active).map((r) => r.service_category_id));

    if (p.latitude != null && p.longitude != null) {
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      const radiusM = p.service_area?.radiusKm != null ? Number(p.service_area.radiusKm) * 1000 : 25000;
      if (p.service_area?.radiusMiles != null) {
        console.log('\n--- Distance (service area) ---');
        console.log('radiusMiles:', p.service_area.radiusMiles, '-> meters:', Number(p.service_area.radiusMiles) * 1609.34);
      }
      console.log('Welper center: lat=', lat, 'lng=', lng);
      console.log('Radius used in search: from service_area or default 25km');
      const searchLat = 45.5584;
      const searchLng = -73.6727;
      const distM = await client.query(
        `SELECT earth_distance(ll_to_earth($1::float8, $2::float8), ll_to_earth($3::float8, $4::float8)) as d`,
        [lat, lng, searchLat, searchLng],
      );
      const d = Number(distM.rows[0]?.d ?? 0);
      console.log('H1M3C3 approx: lat=45.5584 lng=-73.6727');
      console.log('Distance welper center -> H1M3C3:', (d / 1000).toFixed(2), 'km');
      console.log('Within 25 km?', d <= 25000, '| Within radius?', d <= radiusM);
    } else {
      console.log('\n--- Location ---');
      console.log('No lat/lng: welper would be included by (latitude IS NULL AND longitude IS NULL) branch');
    }
  } finally {
    await client.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
