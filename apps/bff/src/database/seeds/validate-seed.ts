import { DataSource, In } from 'typeorm';
import {
  UserAccount,
  AccountType,
  SelectedRole,
} from '../../domains/user-management/entities/user-account.entity';
import { CustomerProfile } from '../../domains/profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../domains/profile-management/entities/welper-profile.entity';
import { ServiceCategory } from '../../domains/content-management/entities/service-category.entity';
import {
  getTaxonomyNameSet,
  SERVICE_CATEGORY_TAXONOMY,
} from './service-category-taxonomy';
import { shouldSkipUserSeed } from './seed-flags';
import { SEARCH_DEMO_SUBCATEGORY_NAMES } from './seed-category-names';

type ValidationIssue = { level: 'error' | 'warn'; message: string };

/** Accounts that must be dashboard-ready (signup + platform access). */
const DASHBOARD_READY_EMAILS = [
  'e2e-customer@welpco.com',
  'e2e-welper@welpco.com',
] as const;

/** Partial wizard accounts — must have role set but signup stays incomplete. */
const WIZARD_DEMO_EMAILS = ['customer@welpco.com', 'welper@welpco.com'] as const;

/**
 * Post-seed checks so prod/staging seeds match current auth + signup contracts.
 */
async function validateTaxonomyCategories(
  categoryRepo: ReturnType<DataSource['getRepository']>,
  issues: ValidationIssue[],
): Promise<void> {
  const allowed = getTaxonomyNameSet();
  const activeParents = await categoryRepo.find({
    where: { level: 1, isActive: true },
  });
  const activeParentNames = new Set(activeParents.map((p) => p.name));
  for (const parent of SERVICE_CATEGORY_TAXONOMY) {
    if (!activeParentNames.has(parent.name)) {
      issues.push({
        level: 'error',
        message: `Missing active parent category: ${parent.name}`,
      });
    }
    for (const sub of parent.subcategories) {
      const row = await categoryRepo.findOne({
        where: { name: sub.name, level: 2, isActive: true },
      });
      if (!row) {
        issues.push({
          level: 'error',
          message: `Missing active subcategory: ${sub.name}`,
        });
      }
    }
  }
  const activeAll = await categoryRepo.find({ where: { isActive: true } });
  for (const cat of activeAll) {
    if (!allowed.has(cat.name)) {
      issues.push({
        level: 'warn',
        message: `Unexpected active category outside taxonomy: ${cat.name}`,
      });
    }
  }
}

export async function validateSeed(dataSource: DataSource): Promise<void> {
  const issues: ValidationIssue[] = [];
  const skipUsers = shouldSkipUserSeed();
  const categoryRepo = dataSource.getRepository(ServiceCategory);

  await validateTaxonomyCategories(categoryRepo, issues);

  if (skipUsers) {
    const errors = issues.filter((i) => i.level === 'error');
    for (const w of issues.filter((i) => i.level === 'warn')) {
      console.warn(`   ⚠ ${w.message}`);
    }
    for (const e of errors) {
      console.error(`   ✗ ${e.message}`);
    }
    if (errors.length > 0) {
      throw new Error(`Seed validation failed with ${errors.length} error(s)`);
    }
    console.log('✅ Seed validation passed (content + taxonomy only)');
    return;
  }

  const userRepo = dataSource.getRepository(UserAccount);
  const customerRepo = dataSource.getRepository(CustomerProfile);
  const welperRepo = dataSource.getRepository(WelperProfile);

  const users = await userRepo.find({
    where: { email: In([...DASHBOARD_READY_EMAILS, ...WIZARD_DEMO_EMAILS]) },
  });
  const byEmail = new Map(users.map((u) => [u.email, u]));

  for (const email of DASHBOARD_READY_EMAILS) {
    const user = byEmail.get(email);
    if (!user) {
      issues.push({ level: 'error', message: `Missing seeded account: ${email}` });
      continue;
    }
    if (!user.signupCompleted) {
      issues.push({
        level: 'error',
        message: `${email}: signup_completed must be true`,
      });
    }
    const expectedRole =
      user.accountType === AccountType.CUSTOMER
        ? SelectedRole.CUSTOMER
        : user.accountType === AccountType.WELPER
          ? SelectedRole.WELPER
          : null;
    if (expectedRole && user.selectedRole !== expectedRole) {
      issues.push({
        level: 'error',
        message: `${email}: selected_role must be ${expectedRole} (got ${user.selectedRole ?? 'null'})`,
      });
    }
    if (user.accountType === AccountType.CUSTOMER) {
      const profile = await customerRepo.findOne({
        where: { customerId: user.id },
      });
      if (!profile?.onboardingCompleted) {
        issues.push({
          level: 'warn',
          message: `${email}: customer profile onboarding_completed should be true`,
        });
      }
    }
    if (user.accountType === AccountType.WELPER) {
      const profile = await welperRepo.findOne({ where: { welperId: user.id } });
      if (!profile?.onboardingCompleted) {
        issues.push({
          level: 'warn',
          message: `${email}: welper profile onboarding_completed should be true`,
        });
      }
    }
  }

  for (const email of WIZARD_DEMO_EMAILS) {
    const user = byEmail.get(email);
    if (!user) {
      issues.push({ level: 'error', message: `Missing seeded account: ${email}` });
      continue;
    }
    if (user.signupCompleted) {
      issues.push({
        level: 'warn',
        message: `${email}: expected signup_completed false (wizard demo account)`,
      });
    }
    const expectedRole =
      user.accountType === AccountType.CUSTOMER
        ? SelectedRole.CUSTOMER
        : user.accountType === AccountType.WELPER
          ? SelectedRole.WELPER
          : null;
    if (expectedRole && user.selectedRole !== expectedRole) {
      issues.push({
        level: 'error',
        message: `${email}: selected_role must be ${expectedRole}`,
      });
    }
  }

  const admin = await userRepo.findOne({
    where: { email: 'admin@welpco.local' },
  });
  if (!admin) {
    issues.push({ level: 'error', message: 'Missing admin@welpco.local' });
  } else if (admin.accountType !== AccountType.ADMIN) {
    issues.push({ level: 'error', message: 'admin@welpco.local must be Admin account type' });
  }

  const categories = await categoryRepo.find({
    where: { name: In([...SEARCH_DEMO_SUBCATEGORY_NAMES]), isActive: true },
  });
  const found = new Set(categories.map((c) => c.name));
  const requiredForSearch = ['Babysitter', 'Dog Walks', 'Tutoring', 'Housekeeping'];
  for (const name of requiredForSearch) {
    if (!found.has(name)) {
      issues.push({
        level: 'error',
        message: `Missing active service category for search demo: ${name}`,
      });
    }
  }
  if (!found.has('Pet Sitting') && !found.has('Pet-sitting')) {
    issues.push({
      level: 'warn',
      message: 'Neither "Pet Sitting" nor "Pet-sitting" category is active (pet demo offerings may be skipped)',
    });
  }

  const errors = issues.filter((i) => i.level === 'error');
  const warns = issues.filter((i) => i.level === 'warn');

  for (const w of warns) {
    console.warn(`   ⚠ ${w.message}`);
  }
  for (const e of errors) {
    console.error(`   ✗ ${e.message}`);
  }

  if (errors.length > 0) {
    throw new Error(`Seed validation failed with ${errors.length} error(s)`);
  }

  console.log('✅ Seed validation passed');
}
