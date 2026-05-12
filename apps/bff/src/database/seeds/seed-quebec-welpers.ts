import { DataSource, In } from 'typeorm';
import * as bcrypt from 'bcrypt';
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
import type { GeoJSONPoint } from '../../common/types';

/** City config: [longitude, latitude] for GeoJSON Point, and display name */
const CITIES: { key: string; coords: [number, number]; name: string }[] = [
  { key: 'quebec', coords: [-71.2082, 46.8139], name: 'Quebec City' },
  { key: 'montreal', coords: [-73.5673, 45.5017], name: 'Montreal' },
  { key: 'brossard', coords: [-73.4654, 45.4501], name: 'Brossard' },
];

const WELPERS_PER_CITY = 10;
const FIRST_NAMES = ['Marie', 'Jean', 'Sophie', 'Pierre', 'Julie', 'François', 'Isabelle', 'Nicolas', 'Valérie', 'Alexandre'];
const LAST_NAMES = ['Tremblay', 'Gagnon', 'Roy', 'Côté', 'Bouchard', 'Gauthier', 'Morin', 'Lavoie', 'Fortin', 'Bergeron'];

const CATEGORY_NAMES = ['Babysitter', 'Child Care', 'Dog Walks', 'Pet-sitting', 'Tutoring', 'Housekeeping'];
const BIOS = [
  'Experienced and reliable. I love helping families and take pride in quality service.',
  'Friendly professional with a passion for care. Flexible schedule and great references.',
  'Detail-oriented and trustworthy. Your peace of mind is my priority.',
  'Local provider with years of experience. Available weekdays and weekends.',
  'Certified and caring. I bring patience and enthusiasm to every job.',
  'Reliable, punctual, and dedicated. Let me help make your life easier.',
  'Compassionate and professional. I adapt to your needs and schedule.',
  'Experienced in childcare and home services. References available on request.',
  'Bilingual (EN/FR). Flexible, responsible, and great with kids and pets.',
  'Trusted by many families in the area. I offer consistent, quality service.',
];

/**
 * Seeds 30 welpers in Quebec City, Montreal, and Brossard for search and radius demos.
 * Run after seedContent (categories) and seedSearchDemo. Creates users, welper profiles
 * with service_area as GeoJSON Point (and lat/lng), and one service offering each.
 */
export async function seedQuebecWelpers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(UserAccount);
  const welperProfileRepo = dataSource.getRepository(WelperProfile);
  const serviceOfferingRepo = dataSource.getRepository(ServiceOffering);
  const categoryRepo = dataSource.getRepository(ServiceCategory);

  console.log('🌱 Seeding Quebec welpers (30 in Quebec City, Montreal, Brossard)...');

  const categories = await categoryRepo.find({
    where: { name: In(CATEGORY_NAMES), isActive: true },
  });
  const categoryByName = new Map(categories.map((c) => [c.name, c]));
  if (categories.length === 0) {
    console.log('   ⚠ No categories found. Run seed with content first.');
    return;
  }

  const defaultCategory = categoryByName.get('Babysitter') ?? categories[0];
  const passwordHash = await bcrypt.hash('Welper123!', 12);

  let created = 0;
  let updated = 0;

  for (const city of CITIES) {
    const [lng, lat] = city.coords;
    const serviceArea: GeoJSONPoint = { type: 'Point', coordinates: [lng, lat] };

    for (let i = 1; i <= WELPERS_PER_CITY; i++) {
      const email = `${city.key}-welper-${String(i).padStart(2, '0')}@welpco.com`;
      const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length];
      const bio = BIOS[(i - 1) % BIOS.length];

      let user = await userRepo.findOne({ where: { email } });
      if (!user) {
        user = userRepo.create({
          email,
          passwordHash,
          accountType: AccountType.WELPER,
          status: AccountStatus.ACTIVE,
          emailVerified: true,
        });
        user = await userRepo.save(user);
        created++;
      }

      let profile = await welperProfileRepo.findOne({ where: { welperId: user.id } });
      const countryCode = 'CA';
      const provinceCode = 'QC';
      if (!profile) {
        profile = welperProfileRepo.create({
          welperId: user.id,
          firstName,
          lastName,
          phoneNumber: null,
          bio,
          profilePhotoUrl: null,
          serviceArea,
          latitude: lat,
          longitude: lng,
          countryCode,
          provinceCode,
          rating: null,
          reviewCount: 0,
          profileCompletionStatus: ProfileCompletionStatus.COMPLETE,
          profileVisibility: ProfileVisibility.PUBLIC,
          onboardingCompleted: true,
        });
        profile = await welperProfileRepo.save(profile);
      } else {
        profile.firstName = firstName;
        profile.lastName = lastName;
        profile.bio = bio;
        profile.serviceArea = serviceArea;
        profile.latitude = lat;
        profile.longitude = lng;
        profile.countryCode = countryCode;
        profile.provinceCode = provinceCode;
        profile.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
        profile.profileVisibility = ProfileVisibility.PUBLIC;
        profile.onboardingCompleted = true;
        await welperProfileRepo.save(profile);
        updated++;
      }

      const existingOfferings = await serviceOfferingRepo.find({ where: { welperId: user.id } });
      if (existingOfferings.length === 0) {
        await serviceOfferingRepo.save(
          serviceOfferingRepo.create({
            welperId: user.id,
            serviceCategoryId: defaultCategory.id,
            serviceDescription: `${defaultCategory.name} in ${city.name}. ${bio}`,
            hourlyRate: 18 + (i % 12),
            experienceYears: 1 + (i % 5),
            subcategoryIds: [],
            active: true,
          }),
        );
      }
    }
  }

  console.log(`   ✅ 30 welpers ensured in Quebec City, Montreal, Brossard (${created} new users, ${updated} existing profiles updated).`);
  console.log('✅ Quebec welpers seed complete.');
}
