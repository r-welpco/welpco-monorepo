import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { basePostgresDataSourceOptions } from '../db-cli-options';
import { allEntities } from '../database.module';
import { isProductionLikeSeed } from './seed-flags';
import { seedPayoutTestBookings } from './seed-payout-test-bookings';

config({ path: join(__dirname, '../../../.env') });
config({ path: join(__dirname, '../../../.env.local') });

function assertDevSeedAllowed(): void {
  if (isProductionLikeSeed()) {
    console.error(
      '❌ Refusing payout test booking seed on production-like database. Use a local dev DB.',
    );
    process.exit(1);
  }
}

async function main(): Promise<void> {
  assertDevSeedAllowed();

  const dataSource = new DataSource(
    basePostgresDataSourceOptions({
      entities: allEntities,
      synchronize: false,
      logging: false,
    }),
  );

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');
    await seedPayoutTestBookings(dataSource);
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Payout test booking seed failed:', error);
    process.exit(1);
  }
}

main();
