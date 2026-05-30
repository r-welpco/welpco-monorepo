import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CustomerProfile } from '../entities/customer-profile.entity';
import { UserAccount } from '../../user-management/entities/user-account.entity';
import { ProfileCompletionStatus } from '../entities/profile-completion-status.enum';
import { CreateCustomerProfileDto } from './dto/create-customer-profile.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { EventPublisherService } from '../events/event-publisher.service';
import { formatCustomerDisplayNameForWelper } from '../../../common/display-name.util';

export interface CustomerDisplayInfo {
  displayName: string;
  photoUrl: string | null;
}

@Injectable()
export class CustomerProfileService {
  constructor(
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(UserAccount)
    private userAccountRepository: Repository<UserAccount>,
    private eventPublisher: EventPublisherService,
  ) {}

  async findByCustomerId(customerId: string): Promise<CustomerProfile> {
    const profile = await this.customerProfileRepository.findOne({
      where: { customerId },
    });

    if (!profile) {
      throw new NotFoundException('Customer profile not found');
    }

    return profile;
  }

  async findDisplayInfoByCustomerIds(
    customerIds: string[],
  ): Promise<Map<string, CustomerDisplayInfo>> {
    const uniqueIds = [...new Set(customerIds.filter(Boolean))];
    if (uniqueIds.length === 0) return new Map();

    const profiles = await this.customerProfileRepository.find({
      where: { customerId: In(uniqueIds) },
    });

    return new Map(
      profiles.map((profile) => [
        profile.customerId,
        {
          displayName: formatCustomerDisplayNameForWelper(profile.firstName, profile.lastName),
          photoUrl: profile.profilePhotoUrl ?? null,
        },
      ]),
    );
  }

  async findDisplayInfoByCustomerId(customerId: string): Promise<CustomerDisplayInfo | null> {
    const map = await this.findDisplayInfoByCustomerIds([customerId]);
    return map.get(customerId) ?? null;
  }

  async create(
    createDto: CreateCustomerProfileDto,
  ): Promise<CustomerProfile> {
    // Check if profile already exists
    const existing = await this.customerProfileRepository.findOne({
      where: { customerId: createDto.customerId },
    });

    if (existing) {
      throw new ForbiddenException('Customer profile already exists');
    }

    const profile = this.customerProfileRepository.create(createDto);
    profile.profileCompletionStatus = await this.computeCompletionStatus(profile);

    const saved = await this.customerProfileRepository.save(profile);

    // Publish event
    await this.eventPublisher.publishProfileCreated({
      profileId: saved.id,
      customerId: saved.customerId,
      profileType: 'customer',
      timestamp: new Date().toISOString(),
    });

    return saved;
  }

  async update(
    customerId: string,
    updateDto: UpdateCustomerProfileDto,
    userId: string, // Authenticated user ID
  ): Promise<CustomerProfile> {
    // Verify ownership
    if (customerId !== userId) {
      throw new ForbiddenException(
        'You can only update your own profile',
      );
    }

    const profile = await this.findByCustomerId(customerId);

    // Update fields
    if (updateDto.firstName !== undefined) {
      profile.firstName = updateDto.firstName;
    }
    if (updateDto.lastName !== undefined) {
      profile.lastName = updateDto.lastName;
    }
    if (updateDto.phoneNumber !== undefined) {
      profile.phoneNumber = updateDto.phoneNumber;
    }
    if (updateDto.address !== undefined) {
      profile.address = updateDto.address;
    }
    if (updateDto.profilePhotoUrl !== undefined) {
      profile.profilePhotoUrl = updateDto.profilePhotoUrl;
    }

    // Recalculate completion status
    profile.profileCompletionStatus = await this.computeCompletionStatus(profile);

    const updated = await this.customerProfileRepository.save(profile);

    // Publish event
    await this.eventPublisher.publishProfileUpdated({
      profileId: updated.id,
      customerId: updated.customerId,
      profileType: 'customer',
      timestamp: new Date().toISOString(),
    });

    return updated;
  }

  async markOnboardingComplete(
    customerId: string,
    userId: string,
  ): Promise<CustomerProfile> {
    // Verify ownership
    if (customerId !== userId) {
      throw new ForbiddenException(
        'You can only mark your own onboarding as complete',
      );
    }

    const profile = await this.findByCustomerId(customerId);
    profile.onboardingCompleted = true;
    return this.customerProfileRepository.save(profile);
  }

  /**
   * Service preferences for API (merged with defaults). Stored in `service_preferences` JSONB.
   */
  async getServicePreferencesForCustomer(customerId: string): Promise<{
    id: string;
    customerId: string;
    preferredCategories: string[];
    minPrice?: number;
    maxPrice?: number;
    preferredServiceArea?: Record<string, unknown>;
    notifyNewWelpers: boolean;
    notifyPriceChanges: boolean;
    notifyAvailability: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> {
    const profile = await this.findByCustomerId(customerId);
    const raw = (profile.servicePreferences ?? {}) as Record<string, unknown>;
    const preferredCategories = Array.isArray(raw.preferredCategories)
      ? (raw.preferredCategories as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];
    return {
      id: profile.id,
      customerId: profile.customerId,
      preferredCategories,
      minPrice: typeof raw.minPrice === 'number' ? raw.minPrice : undefined,
      maxPrice: typeof raw.maxPrice === 'number' ? raw.maxPrice : undefined,
      preferredServiceArea:
        raw.preferredServiceArea && typeof raw.preferredServiceArea === 'object'
          ? (raw.preferredServiceArea as Record<string, unknown>)
          : undefined,
      notifyNewWelpers: raw.notifyNewWelpers !== false,
      notifyPriceChanges: raw.notifyPriceChanges !== false,
      notifyAvailability: raw.notifyAvailability !== false,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }

  async updateServicePreferences(
    customerId: string,
    userId: string,
    patch: {
      preferredCategories?: string[];
      minPrice?: number;
      maxPrice?: number;
      preferredServiceArea?: Record<string, unknown>;
      notifyNewWelpers?: boolean;
      notifyPriceChanges?: boolean;
      notifyAvailability?: boolean;
    },
  ): Promise<ReturnType<CustomerProfileService['getServicePreferencesForCustomer']>> {
    if (customerId !== userId) {
      throw new ForbiddenException('You can only update your own preferences');
    }
    const profile = await this.findByCustomerId(customerId);
    const prev = (profile.servicePreferences ?? {}) as Record<string, unknown>;
    const next: Record<string, unknown> = { ...prev };
    if (patch.preferredCategories !== undefined) {
      next.preferredCategories = patch.preferredCategories;
    }
    if (patch.minPrice !== undefined) {
      next.minPrice = patch.minPrice;
    }
    if (patch.maxPrice !== undefined) {
      next.maxPrice = patch.maxPrice;
    }
    if (patch.preferredServiceArea !== undefined) {
      next.preferredServiceArea = patch.preferredServiceArea;
    }
    if (patch.notifyNewWelpers !== undefined) {
      next.notifyNewWelpers = patch.notifyNewWelpers;
    }
    if (patch.notifyPriceChanges !== undefined) {
      next.notifyPriceChanges = patch.notifyPriceChanges;
    }
    if (patch.notifyAvailability !== undefined) {
      next.notifyAvailability = patch.notifyAvailability;
    }
    profile.servicePreferences = next;
    await this.customerProfileRepository.save(profile);
    return this.getServicePreferencesForCustomer(customerId);
  }

  /** Recalculate after Stripe default payment method changes (same user id as customerId). */
  async refreshProfileCompletionFromPayment(userId: string): Promise<void> {
    const profile = await this.customerProfileRepository.findOne({
      where: { customerId: userId },
    });
    if (!profile) return;
    profile.profileCompletionStatus = await this.computeCompletionStatus(profile);
    await this.customerProfileRepository.save(profile);
  }

  private async computeCompletionStatus(profile: CustomerProfile): Promise<ProfileCompletionStatus> {
    if (
      !profile.firstName ||
      !profile.lastName ||
      !profile.phoneNumber ||
      !profile.address
    ) {
      return ProfileCompletionStatus.INCOMPLETE;
    }
    const user = await this.userAccountRepository.findOne({
      where: { id: profile.customerId },
    });
    if (!user?.stripeDefaultPaymentMethodId) {
      return ProfileCompletionStatus.INCOMPLETE;
    }
    return ProfileCompletionStatus.COMPLETE;
  }
}

