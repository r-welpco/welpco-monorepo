import { DataSource, In } from 'typeorm';
import {
  UserAccount,
  AccountType,
  AccountStatus,
} from '../../domains/user-management/entities/user-account.entity';
import { WelperProfile } from '../../domains/profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../../domains/profile-management/entities/service-offering.entity';
import { ServiceCategory } from '../../domains/content-management/entities/service-category.entity';
import { ProfileCompletionStatus } from '../../domains/profile-management/entities/profile-completion-status.enum';
import { ProfileVisibility } from '../../domains/profile-management/entities/profile-visibility.enum';
import {
  SEARCH_DEMO_SUBCATEGORY_NAMES,
  pickSeedSubcategory,
} from './seed-category-names';
import {
  applySeedMarketplaceWelperUser,
  applySeedWelperProfileReady,
} from './seed-user-helpers';

/**
 * Seeds demo data for Service Discovery search: complete public welper profiles
 * and active service offerings so GET /api/search/services returns results.
 * Run after seed.ts (which creates users + seedContent which creates categories).
 */
export async function seedSearchDemo(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(UserAccount);
  const welperProfileRepo = dataSource.getRepository(WelperProfile);
  const serviceOfferingRepo = dataSource.getRepository(ServiceOffering);
  const categoryRepo = dataSource.getRepository(ServiceCategory);

  console.log('🌱 Seeding search demo (complete welper profiles + service offerings)...');

  // Use subcategories only (level 2); questions are attached to subcategories
  const categories = await categoryRepo.find({
    where: { name: In([...SEARCH_DEMO_SUBCATEGORY_NAMES]), isActive: true },
  });
  const categoryByName = new Map(categories.map((c) => [c.name, c]));

  if (categories.length === 0) {
    console.log('   ⚠ No categories found. Run seed with content first (seedContent creates categories).');
    return;
  }

  const fallback = categories[0];
  const babysitterCategory = pickSeedSubcategory(categoryByName, ['Babysitter'], fallback);
  const childCareCategory = pickSeedSubcategory(categoryByName, ['Child Care'], fallback);
  const dogWalksCategory = pickSeedSubcategory(categoryByName, ['Dog Walks'], fallback);
  const petSittingCategory = pickSeedSubcategory(
    categoryByName,
    ['Pet Sitting', 'Pet-sitting'],
    fallback,
  );
  const tutoringCategory = pickSeedSubcategory(categoryByName, ['Tutoring'], fallback);
  const housekeepingCategory = pickSeedSubcategory(categoryByName, ['Housekeeping'], fallback);

  const welperEmails = ['welper@welpco.com', 'e2e-welper@welpco.com'];
  const welperUsers = await userRepo.find({
    where: { email: In(welperEmails), accountType: AccountType.WELPER },
  });

  for (const user of welperUsers) {
    // e2e-welper is dashboard-ready; welper@welpco.com stays signup-incomplete for wizard tests.
    if (user.email === 'e2e-welper@welpco.com') {
      applySeedMarketplaceWelperUser(user);
      await userRepo.save(user);
    }

    let profile = await welperProfileRepo.findOne({ where: { welperId: user.id } });
    if (!profile) continue;

    if (user.email === 'e2e-welper@welpco.com') {
      applySeedWelperProfileReady(profile, {
        firstName: 'Jane',
        lastName: 'Doe',
      });
    }

    profile.firstName = user.email === 'welper@welpco.com' ? 'Alex' : 'Jane';
    profile.lastName = user.email === 'welper@welpco.com' ? 'Rivera' : 'Doe';
    profile.bio =
      user.email === 'welper@welpco.com'
        ? 'Experienced babysitter and childcare provider. I love working with kids and offer flexible hours for date nights and after-school care. CPR certified.'
        : 'Pet care specialist: dog walking, feeding, and overnight stays. Reliable and caring for your furry family members.';
    profile.profilePhotoUrl = null;
    profile.serviceArea = null;
    profile.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
    profile.profileVisibility = ProfileVisibility.PUBLIC;
    profile.onboardingCompleted = true;
    await welperProfileRepo.save(profile);

    const existingOfferings = await serviceOfferingRepo.find({
      where: { welperId: user.id },
    });
    if (existingOfferings.length > 0) {
      console.log('   ✅ Welper already has offerings:', user.email);
      continue;
    }

    if (user.email === 'welper@welpco.com') {
      await serviceOfferingRepo.save(
        serviceOfferingRepo.create({
          welperId: user.id,
          serviceCategoryId: babysitterCategory.id,
          serviceDescription: 'Babysitting and childcare. I provide fun, safe care for children of all ages. Activities, meals, and bedtime routines.',
          hourlyRate: 22,
          experienceYears: 4,
          subcategoryIds: [],
          active: true,
        }),
      );
      await serviceOfferingRepo.save(
        serviceOfferingRepo.create({
          welperId: user.id,
          serviceCategoryId: childCareCategory.id,
          serviceDescription: 'Child care. Compassionate and patient. Help with homework, light housekeeping, and companionship.',
          hourlyRate: 20,
          experienceYears: 3,
          subcategoryIds: [],
          active: true,
        }),
      );
      console.log('   ✅ Created 2 service offerings for', user.email);
    } else {
      await serviceOfferingRepo.save(
        serviceOfferingRepo.create({
          welperId: user.id,
          serviceCategoryId: dogWalksCategory.id,
          serviceDescription: 'Dog walking. Daily walks, feeding, playtime. Your pets will be in good hands.',
          hourlyRate: 18,
          experienceYears: 2,
          subcategoryIds: [],
          active: true,
        }),
      );
      console.log('   ✅ Created 1 service offering for', user.email);
    }
  }

  // Add a third welper for search variety (tutoring / education)
  let demoUser = await userRepo.findOne({ where: { email: 'search-demo@welpco.com' } });
  if (!demoUser) {
    const bcrypt = await import('bcrypt');
    const passwordHash = await bcrypt.hash('Demo123!', 12);
    demoUser = userRepo.create({
      email: 'search-demo@welpco.com',
      passwordHash,
      accountType: AccountType.WELPER,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
    });
    demoUser = await userRepo.save(demoUser);
    console.log('   ✅ Created user search-demo@welpco.com');
  }

  let demoProfile = await welperProfileRepo.findOne({ where: { welperId: demoUser.id } });
  if (!demoProfile) {
    demoProfile = welperProfileRepo.create({
      welperId: demoUser.id,
      firstName: 'Sam',
      lastName: 'Chen',
      phoneNumber: null,
      bio: 'Math and science tutor for K-12. Patient and clear. I help with homework, test prep, and building confidence. Online or in-person.',
      profilePhotoUrl: null,
      serviceArea: null,
      profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
      profileVisibility: ProfileVisibility.PUBLIC,
      onboardingCompleted: true,
    });
    demoProfile = await welperProfileRepo.save(demoProfile);
    console.log('   ✅ Created welper profile for search-demo@welpco.com');
  } else {
    demoProfile.firstName = 'Sam';
    demoProfile.lastName = 'Chen';
    demoProfile.bio =
      'Math and science tutor for K-12. Patient and clear. I help with homework, test prep, and building confidence. Online or in-person.';
    demoProfile.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
    demoProfile.profileVisibility = ProfileVisibility.PUBLIC;
    await welperProfileRepo.save(demoProfile);
  }

  const demoOfferings = await serviceOfferingRepo.find({ where: { welperId: demoUser.id } });
  if (demoOfferings.length === 0) {
    await serviceOfferingRepo.save(
      serviceOfferingRepo.create({
        welperId: demoUser.id,
        serviceCategoryId: tutoringCategory.id,
        serviceDescription: 'Tutoring in math, physics, and chemistry. Grades 6-12. Test prep for SAT/ACT. Flexible scheduling.',
        hourlyRate: 35,
        experienceYears: 5,
        subcategoryIds: [],
        active: true,
      }),
    );
    await serviceOfferingRepo.save(
      serviceOfferingRepo.create({
        welperId: demoUser.id,
        serviceCategoryId: housekeepingCategory.id,
        serviceDescription: 'Light housekeeping and organizing. Help with decluttering, laundry, and keeping your space tidy.',
        hourlyRate: 25,
        experienceYears: 2,
        subcategoryIds: [],
        active: true,
      }),
    );
    console.log('   ✅ Created 2 service offerings for search-demo@welpco.com');
  }

  console.log('✅ Search demo seed complete.');
  console.log('   Example searches: "babysit", "pet", "tutor", "care", "Alex", "Jane", "Sam"');
}
