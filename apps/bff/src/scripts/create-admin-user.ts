/**
 * Create (or update) a Welpco admin account for the staff console.
 *
 * Usage:
 *   pnpm --filter @welpco/bff create:admin -- --email you@example.com --password 'YourPass123!'
 *   pnpm create:admin -- you@example.com 'YourPass123!'
 *
 * Requires DB env (apps/bff/.env.local). Password must be at least 8 characters.
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';
import { join } from 'path';
import { basePostgresDataSourceOptions } from '../database/db-cli-options';

config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../../.env.local') });

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

type ExistingUserRow = { id: string; account_type: string };

function printUsage(): void {
  console.log(`Create an Admin user for the Welpco admin console.

Usage:
  pnpm --filter @welpco/bff create:admin -- --email <email> --password <password>
  pnpm create:admin -- <email> <password>

Options:
  -e, --email      Admin email (required)
  -p, --password   Password, min ${MIN_PASSWORD_LENGTH} chars (required)
  -h, --help       Show this help
`);
}

function parseCli(): { email: string; password: string } | null {
  const args = process.argv.slice(2);
  let email: string | undefined;
  let password: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--email' || arg === '-e') {
      email = args[++i]?.trim();
      continue;
    }
    if (arg === '--password' || arg === '-p') {
      password = args[++i];
      continue;
    }
    if (!arg.startsWith('-')) {
      if (!email) email = arg.trim();
      else if (!password) password = arg;
    }
  }

  if (!email || !password) {
    console.error('Error: --email and --password are required.\n');
    printUsage();
    process.exit(1);
  }

  if (!email.includes('@')) {
    console.error('Error: email must look like a valid email address.');
    process.exit(1);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    console.error(`Error: password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    process.exit(1);
  }

  return { email: email.toLowerCase(), password };
}

function readRows<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[];
  return (result as { rows?: T[] }).rows ?? [];
}

async function ensureVerificationRow(dataSource: DataSource, userId: string): Promise<void> {
  const existing = readRows<{ id: string }>(
    await dataSource.query(`SELECT id FROM verification_statuses WHERE user_id = $1 LIMIT 1`, [
      userId,
    ]),
  );
  if (existing.length > 0) return;

  await dataSource.query(
    `INSERT INTO verification_statuses (id, user_id, email_verified, identity_verified)
     VALUES (gen_random_uuid(), $1, true, false)`,
    [userId],
  );
}

async function main(): Promise<void> {
  const parsed = parseCli();
  if (!parsed) return;

  const { email, password } = parsed;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const dataSource = new DataSource(basePostgresDataSourceOptions());
  await dataSource.initialize();

  try {
    const existing = readRows<ExistingUserRow>(
      await dataSource.query(
        `SELECT id, account_type::text AS account_type FROM user_accounts WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [email],
      ),
    );
    const row = existing[0];

    let userId: string;

    if (row) {
      if (row.account_type !== 'Admin') {
        console.error(
          `Error: ${email} already exists as account type "${row.account_type}". Refusing to overwrite.`,
        );
        process.exit(1);
      }
      await dataSource.query(
        `UPDATE user_accounts
         SET password_hash = $2,
             status = 'Active',
             email_verified = true,
             updated_at = NOW()
         WHERE id = $1`,
        [row.id, passwordHash],
      );
      userId = row.id;
      console.log(`Updated admin password for ${email} (id: ${userId})`);
    } else {
      const inserted = readRows<{ id: string }>(
        await dataSource.query(
          `INSERT INTO user_accounts (
             id, email, password_hash, account_type, status, email_verified,
             signup_completed, platform_access_enabled, preferred_locale
           ) VALUES (
             gen_random_uuid(), $1, $2, 'Admin', 'Active', true,
             false, true, 'en'
           )
           RETURNING id`,
          [email, passwordHash],
        ),
      );
      userId =
        inserted[0]?.id ??
        readRows<{ id: string }>(
          await dataSource.query(`SELECT id FROM user_accounts WHERE email = $1 LIMIT 1`, [email]),
        )[0]?.id;
      if (!userId) {
        throw new Error('Insert succeeded but could not resolve new user id');
      }
      console.log(`Created admin user ${email} (id: ${userId})`);
    }

    await ensureVerificationRow(dataSource, userId);
    console.log('Login at the admin app (default http://localhost:8082/login) with these credentials.');
  } finally {
    await dataSource.destroy();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
