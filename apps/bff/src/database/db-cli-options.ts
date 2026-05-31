import type {
  DataSource,
  DataSourceOptions,
  MigrationInterface,
  QueryRunner,
} from 'typeorm';
import type { PostgresConnectionOptions } from 'typeorm/driver/postgres/PostgresConnectionOptions';

/** Extract leading numeric timestamp from a migration class or file name. */
export function migrationTimestampKey(name: string): string {
  const fromSuffix = name.match(/(\d{13,14})(?:\D*)$/);
  if (fromSuffix) return fromSuffix[1]!.padStart(14, '0');
  const fromPrefix = name.match(/^(\d{13,14})/);
  if (fromPrefix) return fromPrefix[1]!.padStart(14, '0');
  return name;
}

function migrationClassName(migration: MigrationInterface): string {
  return migration.constructor.name;
}

/** TypeORM defaults to class-name order; sort by embedded timestamp instead. */
export function sortMigrationsChronologically(
  migrations: MigrationInterface[],
): MigrationInterface[] {
  return [...migrations].sort((a, b) =>
    migrationTimestampKey(migrationClassName(a)).localeCompare(
      migrationTimestampKey(migrationClassName(b)),
    ),
  );
}

/**
 * SSL for managed Postgres (Neon, RDS, etc.).
 * Enabled when NODE_ENV=production, DB_SSL=true, or PGSSLMODE=require|verify-*.
 * Set DB_SSL=false or PGSSLMODE=disable to opt out (e.g. local prod-like runs).
 */
export function postgresSslOption():
  | boolean
  | { rejectUnauthorized: boolean }
  | undefined {
  const mode = process.env.PGSSLMODE?.toLowerCase();
  if (
    process.env.DB_SSL === 'false' ||
    process.env.DB_SSL === '0' ||
    mode === 'disable' ||
    mode === 'allow' ||
    mode === 'prefer'
  ) {
    return undefined;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const sslRequired =
    isProduction ||
    process.env.DB_SSL === 'true' ||
    process.env.DB_SSL === '1' ||
    mode === 'require' ||
    mode === 'verify-full' ||
    mode === 'verify-ca';

  if (sslRequired) {
    return { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' };
  }
  return undefined;
}

export function basePostgresDataSourceOptions(
  overrides: Partial<PostgresConnectionOptions> = {},
): DataSourceOptions {
  const base: PostgresConnectionOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'welpco',
    password: process.env.DB_PASSWORD || 'welpco_dev',
    database: process.env.DB_DATABASE || 'welpco_dev',
    ssl: postgresSslOption(),
    ...overrides,
  };
  return base;
}

/** Matches TypeORM's default Postgres migrations table (see MigrationExecutor). */
async function ensureMigrationsTable(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "migrations" (
      "id" SERIAL NOT NULL,
      "timestamp" bigint NOT NULL,
      "name" character varying NOT NULL,
      CONSTRAINT "PK_migrations_id" PRIMARY KEY ("id")
    )
  `);
}

/**
 * TypeORM's executor orders pending migrations by class name, not filename timestamp.
 * Run pending migrations in chronological order (required for legacy DBs + unix-ms baselines).
 */
export async function runPendingMigrationsInOrder(
  dataSource: DataSource,
): Promise<{ name: string }[]> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await ensureMigrationsTable(queryRunner);

  const executedRows = (await queryRunner.query(
    `SELECT "name" FROM "migrations"`,
  )) as Array<{ name: string }>;
  const executed = new Set(executedRows.map((row) => row.name));

  const ordered = sortMigrationsChronologically([...dataSource.migrations]);
  const applied: { name: string }[] = [];

  try {
    for (const migration of ordered) {
      const name = migrationClassName(migration);
      if (executed.has(name)) continue;

      const runInTransaction =
        (migration as MigrationInterface & { transaction?: boolean }).transaction !==
        false;

      const recordMigration = async () => {
        await queryRunner.query(
          `INSERT INTO "migrations"("timestamp", "name") VALUES ($1, $2)`,
          [Number(migrationTimestampKey(name)), name],
        );
        applied.push({ name });
        executed.add(name);
      };

      if (runInTransaction) {
        await queryRunner.startTransaction();
        try {
          await migration.up(queryRunner);
          await recordMigration();
          await queryRunner.commitTransaction();
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }
      } else {
        await migration.up(queryRunner);
        await queryRunner.startTransaction();
        try {
          await recordMigration();
          await queryRunner.commitTransaction();
        } catch (error) {
          await queryRunner.rollbackTransaction();
          throw error;
        }
      }
    }
  } finally {
    await queryRunner.release();
  }

  return applied;
}
