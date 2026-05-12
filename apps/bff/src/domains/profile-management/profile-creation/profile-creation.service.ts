import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import { ProfileCompletionStatus } from '../entities/profile-completion-status.enum';
import { ProfileVisibility } from '../entities/profile-visibility.enum';

/**
 * Synchronous profile creation for new users (replaces Kafka UserAccountConsumer).
 */
@Injectable()
export class ProfileCreationService {
  private readonly logger = new Logger(ProfileCreationService.name);

  constructor(
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
  ) {}

  /**
   * Create customer or welper profile for a new user.
   * @param manager - Optional EntityManager to run in an existing transaction (e.g. registration) so user_id FK is visible.
   */
  async createProfileForUser(
    userId: string,
    _email: string,
    accountType: string,
    manager?: EntityManager,
  ): Promise<CustomerProfile | WelperProfile> {
    const normalizedType = (accountType || '').toLowerCase();
    const customerRepo = manager ? manager.getRepository(CustomerProfile) : this.customerProfileRepository;
    const welperRepo = manager ? manager.getRepository(WelperProfile) : this.welperProfileRepository;

    if (normalizedType === 'customer') {
      const existing = await customerRepo.findOne({
        where: { customerId: userId },
      });
      if (existing) {
        this.logger.log(`Customer profile already exists for user ${userId}`);
        return existing;
      }
      const profile = customerRepo.create({
        customerId: userId,
        firstName: '',
        lastName: '',
        phoneNumber: null,
        address: null,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        onboardingCompleted: false,
      });
      const saved = await customerRepo.save(profile);
      this.logger.log(`Created customer profile for user ${userId} (id: ${saved.id})`);
      return saved;
    }

    if (normalizedType === 'welper') {
      const existing = await welperRepo.findOne({
        where: { welperId: userId },
      });
      if (existing) {
        this.logger.log(`Welper profile already exists for user ${userId}`);
        return existing;
      }
      const profile = welperRepo.create({
        welperId: userId,
        bio: null,
        profilePhotoUrl: null,
        serviceArea: null,
        profileCompletionStatus: ProfileCompletionStatus.INCOMPLETE,
        profileVisibility: ProfileVisibility.PUBLIC,
        onboardingCompleted: false,
      });
      const saved = await welperRepo.save(profile);
      this.logger.log(`Created welper profile for user ${userId} (id: ${saved.id})`);
      return saved;
    }

    this.logger.warn(`Unknown accountType "${accountType}" for user ${userId}; skipping profile creation`);
    throw new Error(`Unsupported accountType for profile creation: ${accountType}`);
  }
}
