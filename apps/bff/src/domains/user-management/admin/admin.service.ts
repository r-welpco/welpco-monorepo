import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UserAccount, AccountType, AccountStatus } from '../entities/user-account.entity';
import { VerificationStatus, BackgroundCheckStatus } from '../entities/verification-status.entity';
import { CustomerProfile } from '../../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../profile-management/entities/welper-profile.entity';
import { ServiceOffering } from '../../profile-management/entities/service-offering.entity';
import { ProfileCompletionStatus } from '../../profile-management/entities/profile-completion-status.enum';
import { ProfileVisibility } from '../../profile-management/entities/profile-visibility.enum';
import { Review } from '../../review/entities/review.entity';
import { Notification } from '../../notification/entities/notification.entity';
import { ReferralCode } from '../entities/referral-code.entity';
import { Referral } from '../entities/referral.entity';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { EventPublisherService } from '../events/event-publisher.service';
import { UpdateUserAccountStatusDto } from './dto/update-user-account-status.dto';
import { BackgroundCheckService } from '../../safety-verification/background-check.service';
import {
  BackgroundCheckOrder,
  BackgroundCheckPaymentStatus,
} from '../../safety-verification/entities/background-check-order.entity';
import {
  SignupOrchestratorService,
  type SignupFilledData,
  type SignupState,
} from '../auth/signup-orchestrator.service';
import { PayoutMethodChoice } from '../../profile-management/entities/payout-method-choice.enum';

export type AdminUserListRow = UserAccount & {
  backgroundCheckPaid: boolean | null;
  backgroundCheckStatus: string | null;
  signupStepsCompleted: number | null;
  signupStepsRequired: number | null;
  profilePhotoUrl: string | null;
  /** Welper only: ready to appear in search and receive job requests. */
  discoverable: boolean | null;
};

export type AdminUsersSortBy = 'createdAt' | 'email' | 'status' | 'lastLoginAt' | 'signupSteps';
export type AdminUsersSortDir = 'asc' | 'desc';

export type AdminUserDetailExtras = {
  backgroundCheckPaid: boolean | null;
  backgroundCheckPaidAt: string | null;
  backgroundCheckCertnStatus: string | null;
  backgroundCheckCertnApplicantUrl: string | null;
  backgroundCheckFailureReason: string | null;
};

export type AdminSignupStateReadout = {
  signupCompleted: boolean;
  selectedRole: string | null;
  completedSteps: string[];
  nextStep: string | null;
  requiredSteps: string[];
  stepSummaries: {
    welperBackgroundCheck?: {
      paid: boolean;
      certnStatus: string;
      skipped?: boolean;
    };
    welperPayout?: {
      stripeOnboardingCompleted?: boolean;
    };
  };
};

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(UserAccount)
    private userRepository: Repository<UserAccount>,
    @InjectRepository(VerificationStatus)
    private verificationRepository: Repository<VerificationStatus>,
    @InjectRepository(CustomerProfile)
    private customerProfileRepository: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private welperProfileRepository: Repository<WelperProfile>,
    @InjectRepository(ServiceOffering)
    private serviceOfferingRepository: Repository<ServiceOffering>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(ReferralCode)
    private referralCodeRepository: Repository<ReferralCode>,
    @InjectRepository(Referral)
    private referralRepository: Repository<Referral>,
    private usersService: UsersService,
    private eventPublisher: EventPublisherService,
    @InjectRepository(BackgroundCheckOrder)
    private backgroundCheckOrderRepo: Repository<BackgroundCheckOrder>,
    private backgroundCheckService: BackgroundCheckService,
    private signupOrchestrator: SignupOrchestratorService,
  ) {}

  private sanitizeFilledDataForAdmin(
    filledData: SignupFilledData,
  ): AdminSignupStateReadout['stepSummaries'] {
    const summaries: AdminSignupStateReadout['stepSummaries'] = {};
    if (filledData.welperBackgroundCheck) {
      summaries.welperBackgroundCheck = {
        paid: filledData.welperBackgroundCheck.paid,
        certnStatus: filledData.welperBackgroundCheck.certnStatus,
        skipped: filledData.welperBackgroundCheck.skipped,
      };
    }
    if (filledData.welperPayout) {
      summaries.welperPayout = {
        stripeOnboardingCompleted: filledData.welperPayout.stripeOnboardingCompleted,
      };
    }
    return summaries;
  }

  async getSignupStateForAdmin(userId: string): Promise<AdminSignupStateReadout> {
    const state = await this.signupOrchestrator.getState(userId);
    return this.toAdminSignupReadout(state);
  }

  private toAdminSignupReadout(state: SignupState): AdminSignupStateReadout {
    return {
      signupCompleted: state.signupCompleted,
      selectedRole: state.selectedRole,
      completedSteps: state.completedSteps,
      nextStep: state.nextStep,
      requiredSteps: state.requiredSteps,
      stepSummaries: this.sanitizeFilledDataForAdmin(state.filledData),
    };
  }

  private isWelperDiscoverable(
    user: UserAccount,
    profileVisibility: ProfileVisibility | null | undefined,
  ): boolean | null {
    if (user.accountType !== AccountType.WELPER) return null;
    return (
      user.signupCompleted === true &&
      user.emailVerified === true &&
      user.status === AccountStatus.ACTIVE &&
      profileVisibility === ProfileVisibility.PUBLIC
    );
  }

  private async loadWelperProfileVisibilityByUserIds(
    users: UserAccount[],
  ): Promise<Map<string, ProfileVisibility | null>> {
    const visibilityByUserId = new Map<string, ProfileVisibility | null>();
    const welperIds = users
      .filter((u) => u.accountType === AccountType.WELPER)
      .map((u) => u.id);
    if (welperIds.length === 0) return visibilityByUserId;

    const rows = await this.welperProfileRepository.find({
      where: { welperId: In(welperIds) },
      select: ['welperId', 'profileVisibility'],
    });
    for (const row of rows) {
      visibilityByUserId.set(row.welperId, row.profileVisibility);
    }
    return visibilityByUserId;
  }

  private async loadProfilePhotoUrlsByUserIds(
    users: UserAccount[],
  ): Promise<Map<string, string | null>> {
    const photoByUserId = new Map<string, string | null>();
    const customerIds = users
      .filter((u) => u.accountType === AccountType.CUSTOMER)
      .map((u) => u.id);
    const welperIds = users
      .filter((u) => u.accountType === AccountType.WELPER)
      .map((u) => u.id);

    if (customerIds.length > 0) {
      const rows = await this.customerProfileRepository.find({
        where: { customerId: In(customerIds) },
        select: ['customerId', 'profilePhotoUrl'],
      });
      for (const row of rows) {
        photoByUserId.set(row.customerId, row.profilePhotoUrl ?? null);
      }
    }

    if (welperIds.length > 0) {
      const rows = await this.welperProfileRepository.find({
        where: { welperId: In(welperIds) },
        select: ['welperId', 'profilePhotoUrl'],
      });
      for (const row of rows) {
        photoByUserId.set(row.welperId, row.profilePhotoUrl ?? null);
      }
    }

    return photoByUserId;
  }

  private async enrichUsersForList(users: UserAccount[]): Promise<AdminUserListRow[]> {
    const paymentMap = await this.backgroundCheckService.getPaymentSummaryByUserIds(
      users.map((u) => u.id),
    );
    const photoByUserId = await this.loadProfilePhotoUrlsByUserIds(users);
    const visibilityByUserId = await this.loadWelperProfileVisibilityByUserIds(users);
    const signupCounts = await Promise.all(
      users.map((user) => this.getSignupStepCountsForList(user)),
    );

    return users.map((user, index) => {
      const payment = paymentMap.get(user.id);
      const isWelper = user.accountType === AccountType.WELPER;
      const steps = signupCounts[index];
      const profileVisibility = visibilityByUserId.get(user.id);
      return {
        ...user,
        backgroundCheckPaid: isWelper ? (payment?.paid ?? false) : null,
        backgroundCheckStatus:
          user.verificationStatus?.backgroundCheckStatus ?? null,
        signupStepsCompleted: steps.completed,
        signupStepsRequired: steps.required,
        profilePhotoUrl: photoByUserId.get(user.id) ?? null,
        discoverable: this.isWelperDiscoverable(user, profileVisibility),
      };
    });
  }

  private async getSignupStepCountsForList(
    user: UserAccount,
  ): Promise<{ completed: number | null; required: number | null }> {
    const hasSignupFlow =
      user.accountType === AccountType.CUSTOMER ||
      user.accountType === AccountType.WELPER;
    if (!hasSignupFlow) {
      return { completed: null, required: null };
    }
    try {
      const state = await this.signupOrchestrator.getState(user.id);
      return {
        completed: state.completedSteps.length,
        required: state.requiredSteps.length,
      };
    } catch {
      return { completed: null, required: null };
    }
  }

  async findAll(filters?: {
    accountType?: AccountType;
    status?: AccountStatus;
    emailVerified?: boolean;
    signupCompleted?: boolean;
    discoverable?: boolean;
    backgroundCheckStatus?: BackgroundCheckStatus;
    search?: string;
    limit?: number;
    offset?: number;
    sortBy?: AdminUsersSortBy;
    sortDir?: AdminUsersSortDir;
  }): Promise<{ users: AdminUserListRow[]; total: number }> {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.verificationStatus', 'verificationStatus');

    const rawSearch = filters?.search?.trim();
    if (rawSearch) {
      const uuidRe =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (uuidRe.test(rawSearch)) {
        queryBuilder.andWhere('user.id = :searchId', { searchId: rawSearch });
      } else {
        const safe = rawSearch.replace(/[%_\\]/g, '').trim();
        if (safe.length > 0) {
          queryBuilder.andWhere('LOWER(user.email) LIKE LOWER(:like)', {
            like: `%${safe}%`,
          });
        }
      }
    }

    if (filters?.accountType) {
      queryBuilder.andWhere('user.accountType = :accountType', {
        accountType: filters.accountType,
      });
    }

    if (filters?.status) {
      queryBuilder.andWhere('user.status = :status', {
        status: filters.status,
      });
    }

    if (filters?.emailVerified !== undefined) {
      queryBuilder.andWhere('user.emailVerified = :emailVerified', {
        emailVerified: filters.emailVerified,
      });
    }

    if (filters?.signupCompleted !== undefined) {
      queryBuilder.andWhere('user.signupCompleted = :signupCompleted', {
        signupCompleted: filters.signupCompleted,
      });
    }

    if (filters?.discoverable !== undefined) {
      queryBuilder.andWhere('user.accountType = :welperType', {
        welperType: AccountType.WELPER,
      });
      queryBuilder.leftJoin(
        WelperProfile,
        'welperProfile',
        'welperProfile.welper_id = user.id',
      );
      if (filters.discoverable) {
        queryBuilder
          .andWhere('user.signupCompleted = true')
          .andWhere('user.emailVerified = true')
          .andWhere('user.status = :discoverableActive', {
            discoverableActive: AccountStatus.ACTIVE,
          })
          .andWhere('welperProfile.profileVisibility = :discoverablePublic', {
            discoverablePublic: ProfileVisibility.PUBLIC,
          });
      } else {
        queryBuilder.andWhere(
          `(user.signupCompleted = false OR user.emailVerified = false OR user.status != :discoverableActive OR welperProfile.profileVisibility IS NULL OR welperProfile.profileVisibility != :discoverablePublic)`,
          {
            discoverableActive: AccountStatus.ACTIVE,
            discoverablePublic: ProfileVisibility.PUBLIC,
          },
        );
      }
    }

    if (filters?.backgroundCheckStatus) {
      queryBuilder.andWhere(
        'verificationStatus.background_check_status = :backgroundCheckStatus',
        { backgroundCheckStatus: filters.backgroundCheckStatus },
      );
    }

    const total = await queryBuilder.getCount();
    const sortBy = filters?.sortBy ?? 'createdAt';
    const sortDir: 'ASC' | 'DESC' =
      filters?.sortDir === 'asc' ? 'ASC' : 'DESC';

    if (sortBy === 'signupSteps') {
      const allUsers = await queryBuilder.getMany();
      const enriched = await this.enrichUsersForList(allUsers);
      enriched.sort((a, b) => {
        const ac = a.signupStepsCompleted ?? -1;
        const bc = b.signupStepsCompleted ?? -1;
        return sortDir === 'ASC' ? ac - bc : bc - ac;
      });
      const offset =
        Number.isFinite(filters?.offset) && (filters?.offset ?? 0) > 0
          ? filters!.offset!
          : 0;
      const limit =
        Number.isFinite(filters?.limit) && (filters?.limit ?? 0) > 0
          ? Math.min(filters!.limit!, 100)
          : enriched.length;
      return {
        users: enriched.slice(offset, offset + limit),
        total,
      };
    }

    const sortColumn: Record<Exclude<AdminUsersSortBy, 'signupSteps'>, string> = {
      createdAt: 'user.createdAt',
      email: 'user.email',
      status: 'user.status',
      lastLoginAt: 'user.lastLoginAt',
    };
    queryBuilder.orderBy(sortColumn[sortBy], sortDir);

    const limit =
      Number.isFinite(filters?.limit) && (filters?.limit ?? 0) > 0
        ? Math.min(filters!.limit!, 100)
        : 25;
    const offset =
      Number.isFinite(filters?.offset) && (filters?.offset ?? 0) > 0
        ? filters!.offset!
        : 0;
    queryBuilder.limit(limit);
    queryBuilder.offset(offset);

    const users = await queryBuilder.getMany();
    const enriched = await this.enrichUsersForList(users);

    return { users: enriched, total };
  }

  async findOne(userId: string): Promise<UserAccount> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['verificationStatus'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async getProfilePhotoUrlForUser(userId: string): Promise<string | null> {
    const user = await this.findOne(userId);
    const map = await this.loadProfilePhotoUrlsByUserIds([user]);
    return map.get(userId) ?? null;
  }

  async getBackgroundCheckExtras(userId: string): Promise<AdminUserDetailExtras> {
    const user = await this.usersService.findById(userId);
    if (user.accountType !== AccountType.WELPER) {
      return {
        backgroundCheckPaid: null,
        backgroundCheckPaidAt: null,
        backgroundCheckCertnStatus: null,
        backgroundCheckCertnApplicantUrl: null,
        backgroundCheckFailureReason: null,
      };
    }
    const order = await this.backgroundCheckOrderRepo.findOne({ where: { userId } });
    return {
      backgroundCheckPaid: order?.paymentStatus === BackgroundCheckPaymentStatus.PAID,
      backgroundCheckPaidAt: order?.paidAt?.toISOString() ?? null,
      backgroundCheckCertnStatus: order?.certnStatus ?? null,
      backgroundCheckCertnApplicantUrl: order?.certnApplicantUrl ?? null,
      backgroundCheckFailureReason: order?.failureReason ?? null,
    };
  }

  /**
   * Admin-only status change with moderation metadata, audit-friendly previous status, and domain event.
   */
  async updateAccountStatusFromAdmin(
    actorAdminId: string,
    userId: string,
    dto: UpdateUserAccountStatusDto,
  ): Promise<{ user: UserAccount; previousStatus: AccountStatus }> {
    const user = await this.findOne(userId);
    const previousStatus = user.status;
    const now = new Date();

    user.status = dto.status;
    if (dto.status !== previousStatus) {
      user.authVersion = (user.authVersion ?? 0) + 1;
    }
    user.statusChangedAt = now;
    user.statusChangedByAdminId = actorAdminId;

    const needsModeration =
      dto.status === AccountStatus.SUSPENDED || dto.status === AccountStatus.DEACTIVATED;
    if (needsModeration) {
      user.statusChangeReasonCode = dto.reasonCode!;
      const detail = dto.reasonDetail?.trim();
      user.statusChangeReasonDetail = detail && detail.length > 0 ? detail : null;
    } else {
      user.statusChangeReasonCode = null;
      user.statusChangeReasonDetail = null;
    }

    const saved = await this.userRepository.save(user);
    await this.eventPublisher.publishAccountStatusChanged({
      userId: saved.id,
      oldStatus: previousStatus,
      newStatus: saved.status,
      timestamp: now.toISOString(),
    });

    return { user: saved, previousStatus };
  }

  async setBackgroundCheckStatus(
    userId: string,
    status: BackgroundCheckStatus,
  ): Promise<VerificationStatus> {
    const user = await this.usersService.findById(userId);

    // Only Welpers can have background checks
    if (user.accountType !== AccountType.WELPER) {
      throw new BadRequestException(
        'Background check status can only be set for Welper accounts',
      );
    }

    let verificationStatus = await this.verificationRepository.findOne({
      where: { userId },
    });

    if (!verificationStatus) {
      verificationStatus = this.verificationRepository.create({
        userId,
        backgroundCheckStatus: status,
      });
    } else {
      verificationStatus.backgroundCheckStatus = status;
    }

    const saved = await this.verificationRepository.save(verificationStatus);

    // Auto-activate Welper account if background check passes
    if (
      status === BackgroundCheckStatus.PASSED &&
      user.status === AccountStatus.PENDING &&
      user.emailVerified
    ) {
      await this.usersService.updateStatus(userId, AccountStatus.ACTIVE);
    }

    return saved;
  }

  async unlockAccount(userId: string): Promise<void> {
    const user = await this.usersService.findById(userId);
    // Unlock is handled by clearing lockout in cache (via AccountLockoutService)
    // This endpoint is for admin override
  }

  async getPlatformStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingUsers: number;
    suspendedUsers: number;
    deactivatedUsers: number;
    customers: number;
    welpers: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      deactivatedUsers,
      customers,
      welpers,
    ] = await Promise.all([
      this.userRepository.count(),
      this.userRepository.count({ where: { status: AccountStatus.ACTIVE } }),
      this.userRepository.count({ where: { status: AccountStatus.PENDING } }),
      this.userRepository.count({
        where: { status: AccountStatus.SUSPENDED },
      }),
      this.userRepository.count({
        where: { status: AccountStatus.DEACTIVATED },
      }),
      this.userRepository.count({
        where: { accountType: AccountType.CUSTOMER },
      }),
      this.userRepository.count({
        where: { accountType: AccountType.WELPER },
      }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingUsers,
      suspendedUsers,
      deactivatedUsers,
      customers,
      welpers,
    };
  }

  /**
   * Returns profile info for a user (customer or welper profile).
   */
  async getUserProfile(userId: string): Promise<{
    type: 'customer' | 'welper' | null;
    firstName?: string;
    lastName?: string;
    profilePhotoUrl?: string | null;
    profileCompletionStatus?: string;
    onboardingCompleted?: boolean;
    phoneNumber?: unknown;
    address?: unknown;
    bio?: string | null;
    payoutMethodChoice?: string | null;
    stripeConnectConnected?: boolean;
    stripeConnectAccountLast4?: string | null;
    dateOfBirth?: string | null;
    profileVisibility?: string | null;
    verified?: boolean;
    serviceArea?: unknown;
    serviceAreaCity?: string | null;
    serviceAreaPostalCodes?: string[] | null;
    countryCode?: string | null;
    provinceCode?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    availabilityAdHocOnly?: boolean;
  }> {
    const user = await this.findOne(userId);
    if (user.accountType === AccountType.CUSTOMER) {
      const profile = await this.customerProfileRepository.findOne({
        where: { customerId: userId },
      });
      if (!profile) return { type: 'customer' };
      return {
        type: 'customer',
        firstName: profile.firstName,
        lastName: profile.lastName,
        profilePhotoUrl: profile.profilePhotoUrl ?? null,
        profileCompletionStatus: profile.profileCompletionStatus,
        onboardingCompleted: profile.onboardingCompleted,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        dateOfBirth: profile.dateOfBirth
          ? String(profile.dateOfBirth).slice(0, 10)
          : null,
      };
    }
    if (user.accountType === AccountType.WELPER) {
      const profile = await this.welperProfileRepository.findOne({
        where: { welperId: userId },
      });
      if (!profile) return { type: 'welper' };
      const connectId = profile.stripeConnectAccountId?.trim() ?? '';
      return {
        type: 'welper',
        firstName: profile.firstName ?? undefined,
        lastName: profile.lastName ?? undefined,
        profilePhotoUrl: profile.profilePhotoUrl ?? null,
        profileCompletionStatus: profile.profileCompletionStatus,
        onboardingCompleted: profile.onboardingCompleted,
        phoneNumber: profile.phoneNumber,
        bio: profile.bio,
        payoutMethodChoice: profile.payoutMethodChoice ?? null,
        stripeConnectConnected:
          profile.payoutMethodChoice === PayoutMethodChoice.STRIPE && connectId.length > 0,
        stripeConnectAccountLast4:
          connectId.length >= 4 ? connectId.slice(-4) : null,
        dateOfBirth: profile.dateOfBirth
          ? String(profile.dateOfBirth).slice(0, 10)
          : null,
        profileVisibility: profile.profileVisibility,
        verified: profile.verified,
        serviceArea: profile.serviceArea,
        serviceAreaCity: profile.serviceAreaCity,
        serviceAreaPostalCodes: profile.serviceAreaPostalCodes,
        countryCode: profile.countryCode,
        provinceCode: profile.provinceCode,
        latitude: profile.latitude == null ? null : Number(profile.latitude),
        longitude: profile.longitude == null ? null : Number(profile.longitude),
        availabilityAdHocOnly: profile.availabilityAdHocOnly,
      };
    }
    return { type: null };
  }

  /**
   * Admin override: mark a user's profile as complete and/or set onboarding flag.
   */
  async setProfileFlags(
    userId: string,
    flags: { profileComplete?: boolean; onboardingCompleted?: boolean },
  ): Promise<{ profileCompletionStatus: string; onboardingCompleted: boolean }> {
    const user = await this.findOne(userId);

    if (user.accountType === AccountType.CUSTOMER) {
      const profile = await this.customerProfileRepository.findOne({
        where: { customerId: userId },
      });
      if (!profile) {
        throw new NotFoundException('Customer profile not found');
      }
      if (flags.profileComplete !== undefined) {
        profile.profileCompletionStatus = flags.profileComplete
          ? ProfileCompletionStatus.COMPLETE
          : ProfileCompletionStatus.INCOMPLETE;
      }
      if (flags.onboardingCompleted !== undefined) {
        profile.onboardingCompleted = flags.onboardingCompleted;
      }
      const saved = await this.customerProfileRepository.save(profile);
      return {
        profileCompletionStatus: saved.profileCompletionStatus,
        onboardingCompleted: saved.onboardingCompleted,
      };
    }

    if (user.accountType === AccountType.WELPER) {
      const profile = await this.welperProfileRepository.findOne({
        where: { welperId: userId },
      });
      if (!profile) {
        throw new NotFoundException('Welper profile not found');
      }
      if (flags.profileComplete !== undefined) {
        profile.profileCompletionStatus = flags.profileComplete
          ? ProfileCompletionStatus.COMPLETE
          : ProfileCompletionStatus.INCOMPLETE;
      }
      if (flags.onboardingCompleted !== undefined) {
        profile.onboardingCompleted = flags.onboardingCompleted;
      }
      const saved = await this.welperProfileRepository.save(profile);
      return {
        profileCompletionStatus: saved.profileCompletionStatus,
        onboardingCompleted: saved.onboardingCompleted,
      };
    }

    throw new BadRequestException('Only Customer and Welper accounts have profiles');
  }

  // --- Welper offerings (for admin user detail) ---

  async getWelperOfferings(userId: string): Promise<ServiceOffering[]> {
    return this.serviceOfferingRepository.find({
      where: { welperId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  // --- Reviews ---

  async listReviews(filters: {
    page: number;
    limit: number;
    revieweeId?: string;
    reviewerType?: string;
    minRating?: number;
    maxRating?: number;
  }) {
    const qb = this.reviewRepository.createQueryBuilder('r');
    if (filters.revieweeId) qb.andWhere('r.reviewee_id = :rid', { rid: filters.revieweeId });
    if (filters.reviewerType) qb.andWhere('r.reviewer_type = :rt', { rt: filters.reviewerType });
    if (filters.minRating) qb.andWhere('r.rating >= :min', { min: filters.minRating });
    if (filters.maxRating) qb.andWhere('r.rating <= :max', { max: filters.maxRating });
    qb.orderBy('r.created_at', 'DESC');
    const total = await qb.getCount();
    const limit = Math.min(filters.limit, 100);
    qb.skip((filters.page - 1) * limit).take(limit);
    const items = await qb.getMany();
    return { items, total, page: filters.page, limit, totalPages: Math.ceil(total / limit) };
  }

  async deleteReview(id: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.reviewRepository.remove(review);
  }

  // --- Notifications ---

  async listNotifications(filters: {
    page: number;
    limit: number;
    userId?: string;
    channel?: string;
    category?: string;
  }) {
    const qb = this.notificationRepository.createQueryBuilder('n');
    if (filters.userId) qb.andWhere('n.user_id = :uid', { uid: filters.userId });
    if (filters.channel) qb.andWhere('n.channel = :ch', { ch: filters.channel });
    if (filters.category) qb.andWhere('n.category = :cat', { cat: filters.category });
    qb.orderBy('n.created_at', 'DESC');
    const total = await qb.getCount();
    const limit = Math.min(filters.limit, 100);
    qb.skip((filters.page - 1) * limit).take(limit);
    const items = await qb.getMany();
    return { items, total, page: filters.page, limit, totalPages: Math.ceil(total / limit) };
  }

  // --- Referrals ---

  async listReferrals(filters: { page: number; limit: number; status?: string }) {
    const qb = this.referralRepository.createQueryBuilder('r');
    if (filters.status) qb.andWhere('r.status = :s', { s: filters.status });
    qb.orderBy('r.created_at', 'DESC');
    const total = await qb.getCount();
    const limit = Math.min(filters.limit, 100);
    qb.skip((filters.page - 1) * limit).take(limit);
    const items = await qb.getMany();
    return { items, total, page: filters.page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getReferralStats() {
    const total = await this.referralRepository.count();
    const completed = await this.referralRepository.count({ where: { status: 'Completed' as any } });
    const rewarded = await this.referralRepository.count({ where: { status: 'Rewarded' as any } });
    const totalRewardResult = await this.referralRepository
      .createQueryBuilder('r')
      .select('COALESCE(SUM(r.reward_amount), 0)', 'sum')
      .where('r.reward_status = :rs', { rs: 'Awarded' })
      .getRawOne();
    return { total, completed, rewarded, totalRewardAmount: Number(totalRewardResult?.sum ?? 0) };
  }

  // --- Admin user creation ---

  async createAdminUser(email: string, password: string): Promise<UserAccount> {
    const existing = await this.userRepository.findOne({ where: { email: email.toLowerCase() } });
    if (existing) throw new BadRequestException('Email already in use');
    const passwordHash = await bcrypt.hash(password, 12);
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      passwordHash,
      accountType: AccountType.ADMIN,
      status: AccountStatus.ACTIVE,
      emailVerified: true,
    });
    return this.userRepository.save(user);
  }
}
