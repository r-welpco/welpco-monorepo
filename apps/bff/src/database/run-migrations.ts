import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';

/**
 * Migration runner — auto-discovers every migration class via filesystem glob.
 *
 * **Why glob over an explicit list:**
 * Through Wave 2 + Day 15 + Day 16 we landed migrations in three domains
 * (`booking`, `communication`, `user-management`) without anyone updating the
 * static `migrations: [...]` array that used to live here. The runner reported
 * `✅ Migrations completed` because TypeORM has nothing to compare against —
 * "completed" means "everything in the array has been applied," not
 * "everything in the codebase has been applied." Three migrations sat applied
 * locally only via manual `psql` work; a fresh checkout wouldn't have got them.
 *
 * Auto-discovery removes the parallel-edit step. New `*-*.ts` files in any
 * `migrations/` subfolder under `src/` are picked up automatically. Filenames
 * are timestamp-prefixed so alphabetical order = chronological order = the
 * order TypeORM applies them in.
 *
 * Both `.ts` (ts-node dev) and `.js` (compiled prod) shapes are matched.
 */

// Load env from BFF root (covers monorepo-deploy patterns).
config({ path: join(__dirname, '../../.env') });
config({ path: join(__dirname, '../../.env.local') });

async function runMigrations() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'welpco',
    password: process.env.DB_PASSWORD || 'welpco_dev',
    database: process.env.DB_DATABASE || 'welpco_dev',
    // Per-migration transactions so `transaction = false` on individual migrations is respected.
    migrationsTransactionMode: 'each',
    // Glob-discover every migration anywhere under `apps/bff/src/`. Filenames are
    // timestamp-prefixed (`YYYYMMDDHHmmss-*` or unix-ms-`-*`) so lexical sort
    // matches chronological order.
    migrations: [join(__dirname, '..', '**', 'migrations', '*-*.{ts,js}')],
    migrationsRun: false,
    synchronize: false,
    logging: process.env.DB_LOGGING === 'true',
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

    // Surface the discovered count + names BEFORE running so a misconfigured
    // glob (zero matches) is loud instead of silent.
    const allKnownMigrations = dataSource.migrations;
    if (allKnownMigrations.length === 0) {
      throw new Error(
        'No migration classes discovered. The glob pattern matched zero files — verify migrations/ folder layout under src/.'
      );
    }
    console.log(
      `🔎 Discovered ${allKnownMigrations.length} migration class${allKnownMigrations.length === 1 ? '' : 'es'}`
    );

    const applied = await dataSource.runMigrations();
    if (applied.length === 0) {
      console.log('✅ Migrations completed (nothing pending)');
    } else {
      console.log(
        `✅ Migrations completed — applied ${applied.length} new migration${applied.length === 1 ? '' : 's'}:`
      );
      for (const m of applied) {
        console.log(`   • ${m.name}`);
      }
    }

    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error);
    process.exit(1);
  }
}

runMigrations();
