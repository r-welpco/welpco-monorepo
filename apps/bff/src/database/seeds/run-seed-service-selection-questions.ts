import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { basePostgresDataSourceOptions } from '../db-cli-options';
import { isProductionLikeSeed } from './seed-flags';
import {
  ServiceCategory,
  Question,
  ServiceQuestion,
} from '../../domains/content-management/entities';
import { ServiceOffering } from '../../domains/profile-management/entities/service-offering.entity';
import { seedServiceSelectionQuestions } from './seed-service-selection-questions';

config({ path: join(__dirname, '../../../.env') });
config({ path: join(__dirname, '../../../.env.local') });

const entities = [ServiceCategory, Question, ServiceQuestion, ServiceOffering];

function assertSeedAllowed(): void {
  if (isProductionLikeSeed() && process.env.SEED_CONFIRM_PRODUCTION !== 'yes') {
    console.error(
      '❌ Refusing to seed: production-like target detected. Set SEED_CONFIRM_PRODUCTION=yes to proceed.',
    );
    process.exit(1);
  }
}

async function main() {
  assertSeedAllowed();

  const dataSource = new DataSource(
    basePostgresDataSourceOptions({
      entities,
      synchronize: false,
      logging: false,
    }),
  );

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');
    await seedServiceSelectionQuestions(dataSource, {
      replaceLinks: process.env.REPLACE_SERVICE_QUESTIONS !== '0',
      syncTaxonomy: process.env.SKIP_TAXONOMY_SYNC !== '1',
    });
    await dataSource.destroy();
    console.log('✅ Service selection questions seed completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding service selection questions:', error);
    process.exit(1);
  }
}

main();
