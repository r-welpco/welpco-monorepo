import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../../.env.local') });

/** Subquery: ids of users who are not admins */
const NON_ADMIN_IDS = `SELECT id FROM user_accounts WHERE account_type::text <> 'Admin'`;

/** Bookings where either party is a non-admin user */
const BAD_BOOKING_IDS = `
  SELECT br.id FROM booking_requests br
  WHERE br.customer_id IN (${NON_ADMIN_IDS})
     OR br.welper_id IN (${NON_ADMIN_IDS})
`;

/** TypeORM/pg may return rows as an array or as `{ rows: [] }`. */
function firstSelectRow(result: unknown): { count: string } {
  const rows = Array.isArray(result)
    ? result
    : (result as { rows?: { count: string }[] }).rows ?? [];
  const row = rows[0];
  if (!row || typeof row.count !== 'string') {
    throw new Error('Unexpected SELECT result shape from database');
  }
  return row;
}

const DELETE_STEPS: string[] = [
  `DELETE FROM disputes WHERE booking_id IN (${BAD_BOOKING_IDS})`,
  `DELETE FROM messages
   WHERE chat_thread_id IN (SELECT id FROM chat_threads WHERE booking_id IN (${BAD_BOOKING_IDS}))
      OR sender_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM chat_threads WHERE booking_id IN (${BAD_BOOKING_IDS})`,
  `DELETE FROM reviews
   WHERE booking_id IN (${BAD_BOOKING_IDS})
      OR reviewer_id IN (${NON_ADMIN_IDS})
      OR reviewee_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM booking_requests WHERE id IN (${BAD_BOOKING_IDS})`,
  `DELETE FROM favorite_welpers
   WHERE customer_id IN (${NON_ADMIN_IDS}) OR welper_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM availability_exceptions
   WHERE calendar_id IN (
     SELECT ac.id FROM availability_calendars ac
     WHERE ac.welper_id IN (${NON_ADMIN_IDS})
   )`,
  `DELETE FROM availability_calendars WHERE welper_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM service_offerings WHERE welper_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM welper_profiles WHERE welper_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM customer_profiles WHERE customer_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM guardian_accounts
   WHERE guardian_user_id IN (${NON_ADMIN_IDS}) OR minor_user_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM referrals
   WHERE referrer_user_id IN (${NON_ADMIN_IDS}) OR referee_user_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM referral_codes WHERE user_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM verification_statuses WHERE user_id IN (${NON_ADMIN_IDS})`,
  `UPDATE support_tickets SET assigned_to_user_id = NULL
   WHERE assigned_to_user_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM support_tickets WHERE user_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM admin_audit_logs WHERE actor_user_id IN (${NON_ADMIN_IDS})`,
  `DELETE FROM user_accounts WHERE account_type::text <> 'Admin'`,
];

async function main(): Promise<void> {
  if (!process.argv.includes('--yes')) {
    console.error(
      'Refusing to run: this permanently deletes all non-admin users and related rows.',
    );
    console.error('Re-run with: pnpm clean:non-admin-users -- --yes (repo root) or pnpm --filter @welpco/bff clean:non-admin-users -- --yes');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'welpco',
    password: process.env.DB_PASSWORD || 'welpco_dev',
    database: process.env.DB_DATABASE || 'welpco_dev',
    entities: [],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    const beforeNonAdmin = parseInt(
      firstSelectRow(
        await qr.query(
          `SELECT COUNT(*)::text AS count FROM user_accounts WHERE account_type::text <> 'Admin'`,
        ),
      ).count,
      10,
    );
    const adminCount = parseInt(
      firstSelectRow(
        await qr.query(
          `SELECT COUNT(*)::text AS count FROM user_accounts WHERE account_type::text = 'Admin'`,
        ),
      ).count,
      10,
    );
    console.log(`Non-admin users to remove: ${beforeNonAdmin}. Admins kept: ${adminCount}.`);

    if (beforeNonAdmin === 0) {
      await qr.rollbackTransaction();
      console.log('Nothing to do.');
      return;
    }

    for (let i = 0; i < DELETE_STEPS.length; i++) {
      await qr.query(DELETE_STEPS[i]);
      console.log(`Step ${i + 1}/${DELETE_STEPS.length} complete`);
    }

    await qr.commitTransaction();
    console.log('Done. Non-admin users and related data removed.');
  } catch (err) {
    await qr.rollbackTransaction();
    console.error('Clean failed (transaction rolled back):', err);
    process.exitCode = 1;
  } finally {
    await qr.release();
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
