import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import {
  UserAccount,
  AccountType,
  AccountStatus,
} from '../../domains/user-management/entities/user-account.entity';
import { VerificationStatus } from '../../domains/user-management/entities/verification-status.entity';
import { ReferralCode, CodeType } from '../../domains/user-management/entities/referral-code.entity';
import { CustomerProfile } from '../../domains/profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../domains/profile-management/entities/welper-profile.entity';
import { ProfileCompletionStatus } from '../../domains/profile-management/entities/profile-completion-status.enum';
import { ProfileVisibility } from '../../domains/profile-management/entities/profile-visibility.enum';
import { seedContent } from './seed-content';
import { seedHolidays } from './seed-holidays';
import { seedSearchDemo } from './seed-search-demo';
import { seedQuebecWelpers } from './seed-quebec-welpers';
import { seedFixOfferingCategories } from './seed-fix-offering-categories';
import { syncServiceCategoryTaxonomy } from './sync-service-category-taxonomy';
import {
  applySeedCustomerProfileReady,
  applySeedUserAccountFields,
  applySeedWelperProfileReady,
  type SeedUserReadyOptions,
} from './seed-user-helpers';
import { validateSeed } from './validate-seed';
import { shouldSkipUserSeed } from './seed-flags';

/**
 * Seed reference data (categories, questions, FAQ, holidays) and optionally dev test users.
 *
 * Production: run migrations first, then:
 *   SEED_CONFIRM_PRODUCTION=yes SEED_SKIP_USERS=1 pnpm seed:users
 * Categories come from SERVICE_CATEGORY_TAXONOMY (same list as signup i18n + migration sync).
 */
export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const skipUsers = shouldSkipUserSeed();

  if (skipUsers) {
    console.log('🌱 Seeding database (content + taxonomy only — no user accounts)...');
    await syncServiceCategoryTaxonomy(dataSource);
    await seedContent(dataSource);
    await seedHolidays(dataSource);
    await validateSeed(dataSource);
    console.log('✅ Content seed completed (no user accounts created).');
    return;
  }

  const userRepository = dataSource.getRepository(UserAccount);
  const verificationRepository = dataSource.getRepository(VerificationStatus);
  const referralCodeRepository = dataSource.getRepository(ReferralCode);
  const customerProfileRepository = dataSource.getRepository(CustomerProfile);
  const welperProfileRepository = dataSource.getRepository(WelperProfile);

  console.log('🌱 Seeding database (users + profiles + content)...');

  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('✅ Database already has data, ensuring test accounts and profiles exist');
  }

  const ensureUser = async (
    email: string,
    password: string,
    accountType: AccountType,
    referralCode: string,
    displayName?: { firstName: string; lastName: string },
    options?: SeedUserReadyOptions,
  ) => {
    const passwordHash = await bcrypt.hash(password, 12);
    let user = await userRepository.findOne({ where: { email } });

    if (!user) {
      user = userRepository.create({
        email,
        passwordHash,
        accountType,
        status: AccountStatus.ACTIVE,
        emailVerified: true,
      });
    } else {
      user.passwordHash = passwordHash;
      user.accountType = accountType;
      user.status = AccountStatus.ACTIVE;
      user.emailVerified = true;
    }

    applySeedUserAccountFields(user, accountType, options);
    user = await userRepository.save(user);
    console.log('✅ Ensured user:', email);

    const verification = await verificationRepository.findOne({
      where: { userId: user.id },
    });
    if (!verification) {
      await verificationRepository.save(
        verificationRepository.create({
          userId: user.id,
          emailVerified: true,
        }),
      );
    } else if (!verification.emailVerified) {
      verification.emailVerified = true;
      await verificationRepository.save(verification);
    }

    const existingReferralCode = await referralCodeRepository.findOne({
      where: { userId: user.id },
    });
    if (!existingReferralCode) {
      await referralCodeRepository.save(
        referralCodeRepository.create({
          userId: user.id,
          code: referralCode,
          codeType: CodeType.PERSONAL,
          isActive: true,
        }),
      );
    }

    const normalizedType = (accountType || '').toLowerCase();
    const ready =
      options?.signupCompleted === true || options?.onboardingCompleted === true;

    if (normalizedType === 'customer') {
      let profile = await customerProfileRepository.findOne({
        where: { customerId: user.id },
      });
      if (!profile) {
        profile = customerProfileRepository.create({
          customerId: user.id,
          firstName: displayName?.firstName ?? '',
          lastName: displayName?.lastName ?? '',
          phoneNumber: null,
          address: null,
          profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
          onboardingCompleted: false,
        });
        profile = await customerProfileRepository.save(profile);
        console.log('   ✅ Created customer profile for', email);
      }
      if (ready) {
        applySeedCustomerProfileReady(profile, displayName);
        await customerProfileRepository.save(profile);
      }
    } else if (normalizedType === 'welper') {
      let profile = await welperProfileRepository.findOne({
        where: { welperId: user.id },
      });
      if (!profile) {
        profile = welperProfileRepository.create({
          welperId: user.id,
          firstName: displayName?.firstName ?? null,
          lastName: displayName?.lastName ?? null,
          phoneNumber: null,
          bio: null,
          profilePhotoUrl: null,
          serviceArea: null,
          profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
          profileVisibility: ProfileVisibility.PUBLIC,
          onboardingCompleted: false,
        });
        profile = await welperProfileRepository.save(profile);
        console.log('   ✅ Created welper profile for', email);
      }
      if (ready) {
        applySeedWelperProfileReady(profile, displayName);
        await welperProfileRepository.save(profile);
      }
    }

    return user.id;
  };

  await ensureUser(
    'customer@welpco.com',
    'Customer123!',
    AccountType.CUSTOMER,
    'CUSTOMER01',
    { firstName: 'Test', lastName: 'Customer' },
  );

  await ensureUser(
    'welper@welpco.com',
    'Welper123!',
    AccountType.WELPER,
    'WELPER01',
    { firstName: 'Test', lastName: 'Welper' },
  );

  await ensureUser(
    'e2e-customer@welpco.com',
    'Customer123!',
    AccountType.CUSTOMER,
    'E2ECUSTOMER',
    { firstName: 'E2E', lastName: 'Customer' },
    { signupCompleted: true, platformAccessEnabled: true },
  );

  await ensureUser(
    'e2e-welper@welpco.com',
    'Welper123!',
    AccountType.WELPER,
    'E2EWELPER',
    { firstName: 'E2E', lastName: 'Welper' },
    { signupCompleted: true, platformAccessEnabled: true },
  );

  await ensureUser(
    'admin@welpco.local',
    'Admin123!',
    AccountType.ADMIN,
    'ADMIN01',
  );

  await syncServiceCategoryTaxonomy(dataSource);
  await seedContent(dataSource);
  await seedHolidays(dataSource);
  await seedSearchDemo(dataSource);
  await seedQuebecWelpers(dataSource);
  await seedFixOfferingCategories(dataSource);

  await validateSeed(dataSource);

  console.log('✅ Seed data created successfully!');
  console.log('📧 Test accounts (dev only):');
  console.log('   Customer (wizard): customer@welpco.com / Customer123!');
  console.log('   Welper (wizard): welper@welpco.com / Welper123!');
  console.log('   E2E customer (dashboard): e2e-customer@welpco.com / Customer123!');
  console.log('   E2E welper (dashboard): e2e-welper@welpco.com / Welper123!');
  console.log('   Admin (staff app): admin@welpco.local / Admin123!');
}
