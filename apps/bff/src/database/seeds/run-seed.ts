import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { join } from 'path';
import { seedDatabase } from './seed';
import { isProductionLikeSeed } from './seed-flags';
import {
  UserAccount,
  GuardianAccount,
  VerificationStatus,
  ReferralCode,
  Referral,
  EmailVerificationToken,
} from '../../domains/user-management/entities';
import {
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
  AvailabilityException,
  FavoriteWelper,
} from '../../domains/profile-management/entities';
import {
  ServiceCategory,
  Question,
  ServiceQuestion,
  StaticContent,
  FAQItem,
  MarketingPhrase,
  Holiday,
} from '../../domains/content-management/entities';

// Load environment variables from BFF root
config({ path: join(__dirname, '../../../.env') });
config({ path: join(__dirname, '../../../.env.local') });

const allEntities = [
  UserAccount,
  GuardianAccount,
  VerificationStatus,
  ReferralCode,
  Referral,
  EmailVerificationToken,
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
  AvailabilityException,
  FavoriteWelper,
  ServiceCategory,
  Question,
  ServiceQuestion,
  StaticContent,
  FAQItem,
  MarketingPhrase,
  Holiday,
];

function assertSeedAllowed(): void {
  if (isProductionLikeSeed() && process.env.SEED_CONFIRM_PRODUCTION !== 'yes') {
    console.error(
      '❌ Refusing to seed: production-like target detected. Set SEED_CONFIRM_PRODUCTION=yes to proceed.',
    );
    console.error(
      `   NODE_ENV=${process.env.NODE_ENV ?? 'development'} DB_DATABASE=${process.env.DB_DATABASE ?? 'welpco_dev'}`,
    );
    process.exit(1);
  }

  if (isProductionLikeSeed()) {
    console.warn('⚠️  Production-like seed: user accounts are skipped unless SEED_SKIP_USERS=false.');
  }
}

async function runSeed() {
  assertSeedAllowed();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'welpco',
    password: process.env.DB_PASSWORD || 'welpco_dev',
    database: process.env.DB_DATABASE || 'welpco_dev',
    entities: allEntities,
    synchronize: false,
    logging: false,
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established (welpco_dev)');

    await seedDatabase(dataSource);

    await dataSource.destroy();
    console.log('✅ Seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

runSeed();
