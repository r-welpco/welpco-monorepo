import {
  Injectable,
  Logger,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import * as bcrypt from 'bcrypt';
import {
  UserAccount,
  AccountStatus,
  AccountType,
  SelectedRole,
} from '../entities/user-account.entity';
import {
  CustomerProfile,
  WelperProfile,
  ServiceOffering,
  AvailabilityCalendar,
  ProfileCompletionStatus,
  ProfileVisibility,
  PayoutMethodChoice,
  DayOfWeek,
  RecurringPattern,
} from '../../profile-management/entities';
import { NotificationPreference } from '../../notification/entities/notification-preference.entity';
import { ProfileCreationService } from '../../profile-management/profile-creation/profile-creation.service';
import { EmailVerificationService } from './email-verification.service';
import { VerificationStatus } from '../entities/verification-status.entity';
import { ReferralService } from '../referral/referral.service';
import { BeginSignupDto } from '../../../modules/auth/dto/begin-signup.dto';
import { SelectRoleStepDto } from '../../../modules/auth/dto/select-role-step.dto';
import { IdentityStepDto } from '../../../modules/auth/dto/identity-step.dto';
import { WelperBioStepDto } from '../../../modules/auth/dto/welper-bio-step.dto';
import { WelperServiceAreaStepDto } from '../../../modules/auth/dto/welper-service-area-step.dto';
import { WelperOfferingStepDto } from '../../../modules/auth/dto/welper-offering-step.dto';
import { WelperAvailabilityStepDto } from '../../../modules/auth/dto/welper-availability-step.dto';
import { WelperPayoutStepDto } from '../../../modules/auth/dto/welper-payout-step.dto';
import { NotificationPrefsStepDto } from '../../../modules/auth/dto/notification-prefs-step.dto';
import { OptionalProfileStepDto } from '../../../modules/auth/dto/optional-profile-step.dto';

/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Owns the role-conditional required-fields contract for the unified signup
 * wizard. Single source of truth: when a row in `user_accounts` has
 * `signupCompleted: true`, that account has every field its role needs to
 * use the product end-to-end.
 *
 * Boundaries:
 *  - Phase 1 only models persistence + validation. The web wizard wires up
 *    in Phase 2.
 *  - Login / register endpoints stay intact for backward compat. Phase 3
 *    relaxes the unverified-email login throw and wires `EmailVerifiedGuard`
 *    onto bookable actions.
 *  - The orchestrator does NOT speak to Stripe Connect — the welper-payout
 *    step records the user's choice (completed / skipped) only. Stripe
 *    Connect onboarding lives out-of-band (Phase 2/3 wiring TBD).
 */

export type SignupStepName =
  | 'selectRole'
  | 'identity'
  | 'welperBio'
  | 'welperServiceArea'
  | 'welperOffering'
  | 'welperAvailability'
  | 'welperPayout'
  | 'notificationPrefs'
  | 'optionalProfile';

interface SignupFilledData {
  identity?: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    tosAcceptedAt: string;
    privacyAcceptedAt: string;
  };
  welperBio?: { bio: string };
  welperServiceArea?: {
    city: string;
    province: string;
    country: string;
    postalCodes: string[];
  };
  welperOffering?: {
    categoryId: string;
    title: string;
    hourlyRate: number;
    description: string;
  };
  welperAvailability?: {
    weeklySlots?: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    acceptsAdHocOnly?: boolean;
  };
  welperPayout?: {
    stripeOnboardingCompleted?: boolean;
    skip?: boolean;
  };
  notificationPrefs?: {
    preferences: Array<{
      category: string;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
    }>;
  };
  optionalProfile?: {
    photoUrl?: string;
    address?: Record<string, string | undefined>;
  };
}

export interface SignupState {
  userId: string;
  email: string;
  signupCompleted: boolean;
  emailVerified: boolean;
  selectedRole: SelectedRole | null;
  completedSteps: SignupStepName[];
  nextStep: SignupStepName | null;
  requiredSteps: SignupStepName[];
  filledData: SignupFilledData;
}

export interface BeginSignupResult {
  accessToken: string;
  refreshToken: string;
  signupState: SignupState;
}

const CUSTOMER_REQUIRED_STEPS: SignupStepName[] = [
  'selectRole',
  'identity',
  'notificationPrefs',
  'optionalProfile',
];

const WELPER_REQUIRED_STEPS: SignupStepName[] = [
  'selectRole',
  'identity',
  'welperBio',
  'welperServiceArea',
  'welperOffering',
  'welperAvailability',
  'notificationPrefs',
  'optionalProfile',
];

@Injectable()
export class SignupOrchestratorService {
  private readonly logger = new Logger(SignupOrchestratorService.name);
  private readonly saltRounds = 12;

  /** ISO calendar date for Postgres `date` columns (UTC components — avoids TZ drift). */
  private formatDateOnly(d: Date): string {
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  constructor(
    @InjectRepository(UserAccount)
    private readonly userRepo: Repository<UserAccount>,
    @InjectRepository(VerificationStatus)
    private readonly verificationRepo: Repository<VerificationStatus>,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepo: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    @InjectRepository(ServiceOffering)
    private readonly serviceOfferingRepo: Repository<ServiceOffering>,
    @InjectRepository(AvailabilityCalendar)
    private readonly availabilityRepo: Repository<AvailabilityCalendar>,
    @InjectRepository(NotificationPreference)
    private readonly notificationPrefRepo: Repository<NotificationPreference>,
    private readonly profileCreationService: ProfileCreationService,
    private readonly emailVerificationService: EmailVerificationService,
    private readonly referralService: ReferralService,
    private readonly dataSource: DataSource,
  ) {}

  // ---------------------------------------------------------------------
  // Required-fields contract
  // ---------------------------------------------------------------------

  /**
   * Returns the canonical step list for a given role. Exposed for spec /
   * controller use; the orchestrator's `getState` wires it through.
   */
  getRequiredStepsForRole(role: SelectedRole | null): SignupStepName[] {
    if (role === SelectedRole.WELPER) return [...WELPER_REQUIRED_STEPS];
    if (role === SelectedRole.CUSTOMER) return [...CUSTOMER_REQUIRED_STEPS];
    // Role not yet selected — only the role-pick step matters next.
    return ['selectRole'];
  }

  // ---------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------

  /**
   * Begin signup. Idempotent: a re-submit for an email with `signupCompleted:
   * false` returns the existing account state (the wizard reads
   * `GET /auth/signup/state` and resumes). A re-submit for an email with
   * `signupCompleted: true` throws `ConflictException` with code
   * `ACCOUNT_EXISTS`.
   *
   * The verification email is sent fire-and-forget within the same
   * transaction (Wave 2 enumeration-safe pattern).
   *
   * Returns the new tokens + a snapshot of the fresh signup state, so the
   * wizard can use the access token immediately.
   */
  async beginSignup(dto: BeginSignupDto): Promise<{
    user: UserAccount;
    signupState: SignupState;
    isNew: boolean;
  }> {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) {
      if (existing.signupCompleted) {
        throw new ConflictException({
          code: 'ACCOUNT_EXISTS',
          message:
            'An account with this email already exists. Sign in instead.',
        });
      }
      // Idempotent resume: the wizard state-fetches and continues.
      const signupState = await this.getState(existing.id);
      return { user: existing, signupState, isNew: false };
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      // Default `accountType` to CUSTOMER until role is selected. The
      // wizard's `selectRole` step writes both `selectedRole` AND mirrors
      // it back into `accountType` so the legacy domain code keeps working
      // without per-call branching. AccountType locks at role-select time.
      const user = this.userRepo.create({
        email,
        passwordHash,
        accountType: AccountType.CUSTOMER, // placeholder until role selected
        status: AccountStatus.PENDING,
        emailVerified: false,
        signupCompleted: false,
        selectedRole: null,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Verification status row + referral code, mirroring the existing
      // register flow's contract.
      const verification = this.verificationRepo.create({
        userId: savedUser.id,
        emailVerified: false,
      });
      await queryRunner.manager.save(verification);

      try {
        await this.referralService.generateReferralCode(
          savedUser.id,
          queryRunner.manager,
        );
      } catch (err) {
        this.logger.warn(
          `Referral code generation failed for ${savedUser.id}: ${(err as Error).message}`,
        );
      }

      // Fire-and-forget verification email — Wave 2 enumeration-safe pattern.
      // Failures are swallowed inside `generateVerificationToken`; the wizard
      // can re-send via the existing /auth/resend-verification endpoint.
      try {
        await this.emailVerificationService.generateVerificationToken(
          savedUser.id,
          queryRunner.manager,
        );
      } catch (err) {
        this.logger.warn(
          `Verification email dispatch failed for ${savedUser.id}: ${(err as Error).message}`,
        );
      }

      await queryRunner.commitTransaction();
      const signupState = await this.getState(savedUser.id);
      return { user: savedUser, signupState, isNew: true };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Read the current signup state for a user. Source of truth for the wizard.
   */
  async getState(userId: string): Promise<SignupState> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const filledData: SignupFilledData = {};
    const completed = new Set<SignupStepName>();

    if (user.selectedRole) completed.add('selectRole');

    // Identity is stored on the role-specific profile. Either profile may
    // be present; only the matching role's profile counts.
    const role = user.selectedRole;
    let customer: CustomerProfile | null = null;
    let welper: WelperProfile | null = null;
    if (role === SelectedRole.CUSTOMER) {
      customer = await this.customerProfileRepo.findOne({
        where: { customerId: userId },
      });
      if (
        customer &&
        customer.firstName &&
        customer.lastName &&
        customer.phoneNumber
      ) {
        completed.add('identity');
        filledData.identity = {
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phoneNumber.formatted ?? customer.phoneNumber.number,
          dateOfBirth: customer.dateOfBirth
            ? this.formatDateOnly(customer.dateOfBirth)
            : '',
          tosAcceptedAt: customer.tosAcceptedAt?.toISOString() ?? '',
          privacyAcceptedAt: customer.privacyAcceptedAt?.toISOString() ?? '',
        };
      }
      if (
        customer?.profilePhotoUrl ||
        customer?.address ||
        customer?.optionalProfileStepCompletedAt
      ) {
        completed.add('optionalProfile');
        filledData.optionalProfile = {
          photoUrl: customer.profilePhotoUrl ?? undefined,
          address: customer.address
            ? ({ ...customer.address } as unknown as Record<
                string,
                string | undefined
              >)
            : undefined,
        };
      }
    } else if (role === SelectedRole.WELPER) {
      welper = await this.welperProfileRepo.findOne({
        where: { welperId: userId },
      });
      if (welper && welper.firstName && welper.lastName && welper.phoneNumber) {
        completed.add('identity');
        filledData.identity = {
          firstName: welper.firstName,
          lastName: welper.lastName,
          phone: welper.phoneNumber.formatted ?? welper.phoneNumber.number,
          dateOfBirth: welper.dateOfBirth
            ? this.formatDateOnly(welper.dateOfBirth)
            : '',
          tosAcceptedAt: welper.tosAcceptedAt?.toISOString() ?? '',
          privacyAcceptedAt: welper.privacyAcceptedAt?.toISOString() ?? '',
        };
      }
      if (welper?.bio && welper.bio.length >= 120) {
        completed.add('welperBio');
        filledData.welperBio = { bio: welper.bio };
      }
      if (
        welper?.serviceAreaCity &&
        welper?.provinceCode &&
        welper?.countryCode &&
        Array.isArray(welper.serviceAreaPostalCodes) &&
        welper.serviceAreaPostalCodes.length > 0
      ) {
        completed.add('welperServiceArea');
        filledData.welperServiceArea = {
          city: welper.serviceAreaCity,
          province: welper.provinceCode,
          country: welper.countryCode,
          postalCodes: welper.serviceAreaPostalCodes,
        };
      }
      const offering = await this.serviceOfferingRepo.findOne({
        where: { welperId: userId, active: true },
      });
      if (offering) {
        completed.add('welperOffering');
        filledData.welperOffering = {
          categoryId: offering.serviceCategoryId,
          title: '', // legacy: title isn't a separate column; tracked in description preamble
          hourlyRate: Number(offering.hourlyRate),
          description: offering.serviceDescription,
        };
      }
      const slots = await this.availabilityRepo.find({
        where: { welperId: userId, available: true },
      });
      const adHocOnly = welper?.availabilityAdHocOnly === true;
      if (slots.length > 0 || adHocOnly) {
        completed.add('welperAvailability');
        filledData.welperAvailability = adHocOnly
          ? { acceptsAdHocOnly: true }
          : {
              weeklySlots: slots.map((s) => ({
                dayOfWeek: s.dayOfWeek,
                startTime: s.startTime,
                endTime: s.endTime,
              })),
            };
      }
      if (
        welper?.profilePhotoUrl ||
        welper?.optionalProfileStepCompletedAt
      ) {
        completed.add('optionalProfile');
        filledData.optionalProfile = {
          photoUrl: welper.profilePhotoUrl ?? undefined,
        };
      }
      // Welper-payout step is "complete" when the welper has made an explicit
      // choice — either kicked off Stripe Connect or explicitly skipped. NULL
      // means the step hasn't been visited yet.
      if (welper?.payoutMethodChoice) {
        completed.add('welperPayout');
        filledData.welperPayout = {
          stripeOnboardingCompleted:
            welper.payoutMethodChoice === PayoutMethodChoice.STRIPE,
          skip: welper.payoutMethodChoice === PayoutMethodChoice.SKIPPED,
        };
      }
    }

    // Notification prefs: any explicit row counts. Defaults are applied
    // server-side, so "step complete" means the user actually visited.
    const prefs = await this.notificationPrefRepo.find({
      where: { userId },
    });
    if (prefs.length > 0) {
      completed.add('notificationPrefs');
      filledData.notificationPrefs = {
        preferences: prefs.map((p) => ({
          category: p.category,
          emailEnabled: p.emailEnabled,
          inAppEnabled: p.inAppEnabled,
        })),
      };
    }

    const requiredSteps = this.getRequiredStepsForRole(role);
    const completedSteps = requiredSteps.filter((s) => completed.has(s));

    // nextStep is the first required step the user has not completed.
    let nextStep: SignupStepName | null = null;
    for (const step of requiredSteps) {
      if (!completed.has(step)) {
        nextStep = step;
        break;
      }
    }

    return {
      userId: user.id,
      email: user.email,
      signupCompleted: user.signupCompleted,
      emailVerified: user.emailVerified,
      selectedRole: user.selectedRole,
      completedSteps,
      nextStep,
      requiredSteps,
      filledData,
    };
  }

  // ---------------------------------------------------------------------
  // Per-step writers
  // ---------------------------------------------------------------------

  /**
   * Step: selectRole. Locks the role; mirrors into legacy `accountType` so
   * the rest of the domain keeps working. Cannot be called twice with a
   * different role — ConflictException.
   */
  async submitSelectRoleStep(
    userId: string,
    dto: SelectRoleStepDto,
  ): Promise<SignupState> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.selectedRole && user.selectedRole !== dto.role) {
      throw new ConflictException({
        code: 'ROLE_LOCKED',
        message:
          'Role is already set for this account and cannot be changed mid-signup.',
      });
    }
    if (!user.selectedRole) {
      await this.dataSource.transaction(async (manager) => {
        user.selectedRole = dto.role;
        // Mirror the wizard role into the legacy taxonomy.
        user.accountType =
          dto.role === SelectedRole.WELPER
            ? AccountType.WELPER
            : AccountType.CUSTOMER;
        await manager.getRepository(UserAccount).save(user);
        // Create the matching profile shell so subsequent step writes have a
        // row to upsert into.
        await this.profileCreationService.createProfileForUser(
          user.id,
          user.email,
          user.accountType,
          manager,
        );
      });
    }
    return this.getState(userId);
  }

  async submitIdentityStep(
    userId: string,
    dto: IdentityStepDto,
  ): Promise<SignupState> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.selectedRole) {
      throw new BadRequestException(
        'Select a role before submitting identity.',
      );
    }
    const parsed = parsePhoneNumberFromString(dto.phone.trim());
    if (!parsed?.isValid()) {
      // class-validator catches this earlier; defense in depth.
      throw new BadRequestException('Invalid phone number');
    }
    const phoneNumber = {
      countryCode: `+${parsed.countryCallingCode}`,
      number: parsed.nationalNumber,
      formatted: parsed.formatInternational(),
    };

    if (user.selectedRole === SelectedRole.CUSTOMER) {
      const profile = await this.customerProfileRepo.findOne({
        where: { customerId: userId },
      });
      if (!profile) {
        throw new NotFoundException('Customer profile missing');
      }
      profile.firstName = dto.firstName.trim();
      profile.lastName = dto.lastName.trim();
      profile.phoneNumber = phoneNumber;
      profile.dateOfBirth = new Date(dto.dateOfBirth);
      profile.tosAcceptedAt = new Date(dto.tosAcceptedAt);
      profile.privacyAcceptedAt = new Date(dto.privacyAcceptedAt);
      await this.customerProfileRepo.save(profile);
    } else {
      const profile = await this.welperProfileRepo.findOne({
        where: { welperId: userId },
      });
      if (!profile) {
        throw new NotFoundException('Welper profile missing');
      }
      profile.firstName = dto.firstName.trim();
      profile.lastName = dto.lastName.trim();
      profile.phoneNumber = phoneNumber;
      profile.dateOfBirth = new Date(dto.dateOfBirth);
      profile.tosAcceptedAt = new Date(dto.tosAcceptedAt);
      profile.privacyAcceptedAt = new Date(dto.privacyAcceptedAt);
      await this.welperProfileRepo.save(profile);
    }
    return this.getState(userId);
  }

  async submitWelperBioStep(
    userId: string,
    dto: WelperBioStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) throw new NotFoundException('Welper profile missing');
    profile.bio = dto.bio;
    await this.welperProfileRepo.save(profile);
    return this.getState(userId);
  }

  async submitWelperServiceAreaStep(
    userId: string,
    dto: WelperServiceAreaStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) throw new NotFoundException('Welper profile missing');
    profile.serviceAreaCity = dto.city.trim();
    profile.provinceCode = dto.province.trim().toUpperCase();
    profile.countryCode = dto.country.trim().toUpperCase();
    profile.serviceAreaPostalCodes = dto.postalCodes.map((p) =>
      p.trim().toUpperCase(),
    );
    await this.welperProfileRepo.save(profile);
    return this.getState(userId);
  }

  async submitWelperOfferingStep(
    userId: string,
    dto: WelperOfferingStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    // Upsert: one initial offering. The wizard creates exactly one; the
    // welper can add more from the dashboard. Idempotent re-submit overwrites.
    const existing = await this.serviceOfferingRepo.findOne({
      where: { welperId: userId, active: true },
    });
    if (existing) {
      existing.serviceCategoryId = dto.categoryId;
      existing.hourlyRate = dto.hourlyRate;
      // No dedicated `title` column on service_offerings today; the wizard
      // titles are surfaced by the FE at render time. We persist the
      // description (which already does double duty as the offering blurb).
      existing.serviceDescription = dto.description;
      existing.experienceYears = existing.experienceYears ?? 0;
      await this.serviceOfferingRepo.save(existing);
    } else {
      const offering = this.serviceOfferingRepo.create({
        welperId: userId,
        serviceCategoryId: dto.categoryId,
        hourlyRate: dto.hourlyRate,
        serviceDescription: dto.description,
        experienceYears: 0,
        active: true,
        subcategoryIds: [],
      });
      await this.serviceOfferingRepo.save(offering);
    }
    return this.getState(userId);
  }

  async submitWelperAvailabilityStep(
    userId: string,
    dto: WelperAvailabilityStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) throw new NotFoundException('Welper profile missing');

    // Replace-set semantics on re-submit: clear existing wizard-created
    // calendar rows for the welper, write the new ones. The dashboard's
    // availability editor is the long-term source of truth; the wizard is
    // just the bootstrap.
    if (Array.isArray(dto.weeklySlots) && dto.weeklySlots.length > 0) {
      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(AvailabilityCalendar);
        await repo.delete({ welperId: userId });
        for (const slot of dto.weeklySlots!) {
          const row = repo.create({
            welperId: userId,
            dayOfWeek: slot.dayOfWeek as DayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            recurringPattern: RecurringPattern.WEEKLY,
            available: true,
          });
          await repo.save(row);
        }
      });
      profile.availabilityAdHocOnly = false;
      await this.welperProfileRepo.save(profile);
    } else if (dto.acceptsAdHocOnly === true) {
      await this.availabilityRepo.delete({ welperId: userId });
      profile.availabilityAdHocOnly = true;
      await this.welperProfileRepo.save(profile);
    }
    return this.getState(userId);
  }

  async submitWelperPayoutStep(
    userId: string,
    dto: WelperPayoutStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    // Persist the choice so `getState()` can mark the step complete on
    // subsequent reads. Without this, the step was a no-op write — `nextStep`
    // kept returning `welperPayout` and the wizard re-routed to the same
    // step in a loop. Day 15 follow-up #2 (finally landed 2026-05-06).
    //
    // The actual Stripe Connect account state is still verified out-of-band
    // when the welper finishes the hosted onboarding flow (`WELPER-PAYOUTS-001`).
    // For now, `STRIPE` means "the welper clicked Set up payouts and we trust
    // the click as the signal" until the real Connect round-trip lands.
    const choice =
      dto.skip === true
        ? PayoutMethodChoice.SKIPPED
        : PayoutMethodChoice.STRIPE;
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (profile) {
      profile.payoutMethodChoice = choice;
      await this.welperProfileRepo.save(profile);
    }
    return this.getState(userId);
  }

  async submitNotificationPrefsStep(
    userId: string,
    dto: NotificationPrefsStepDto,
  ): Promise<SignupState> {
    // Upsert each preference row. Empty list is acceptable — server defaults
    // (all-on) stay in effect. If the user submitted an empty list we still
    // mark the step complete by persisting a single sentinel preference using
    // the BOOKING category with default values; this is the cheapest
    // server-side primitive that doesn't change behaviour and lets getState()
    // report "completed" honestly.
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(NotificationPreference);
      const items = dto.preferences.length
        ? dto.preferences
        : [{ category: 'booking', emailEnabled: true, inAppEnabled: true }];
      for (const item of items) {
        const existing = await repo.findOne({
          where: { userId, category: item.category as never },
        });
        if (existing) {
          if (item.emailEnabled !== undefined)
            existing.emailEnabled = item.emailEnabled;
          if (item.inAppEnabled !== undefined)
            existing.inAppEnabled = item.inAppEnabled;
          await repo.save(existing);
        } else {
          const row = repo.create({
            userId,
            category: item.category as never,
            emailEnabled: item.emailEnabled ?? true,
            inAppEnabled: item.inAppEnabled ?? true,
          });
          await repo.save(row);
        }
      }
    });
    return this.getState(userId);
  }

  async submitOptionalProfileStep(
    userId: string,
    dto: OptionalProfileStepDto,
  ): Promise<SignupState> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (!user.selectedRole) {
      throw new BadRequestException(
        'Select a role before submitting profile data.',
      );
    }
    if (user.selectedRole === SelectedRole.CUSTOMER) {
      const profile = await this.customerProfileRepo.findOne({
        where: { customerId: userId },
      });
      if (!profile) throw new NotFoundException('Customer profile missing');
      profile.optionalProfileStepCompletedAt = new Date();
      if (dto.photoUrl !== undefined) profile.profilePhotoUrl = dto.photoUrl;
      if (dto.address !== undefined) {
        profile.address = {
          streetAddress: dto.address.streetAddress ?? '',
          city: dto.address.city ?? '',
          state: dto.address.state ?? '',
          zipCode: dto.address.zipCode ?? '',
          country: dto.address.country,
        };
      }
      await this.customerProfileRepo.save(profile);
    } else {
      const profile = await this.welperProfileRepo.findOne({
        where: { welperId: userId },
      });
      if (!profile) throw new NotFoundException('Welper profile missing');
      profile.optionalProfileStepCompletedAt = new Date();
      if (dto.photoUrl !== undefined) profile.profilePhotoUrl = dto.photoUrl;
      await this.welperProfileRepo.save(profile);
    }
    return this.getState(userId);
  }

  // ---------------------------------------------------------------------
  // Finish
  // ---------------------------------------------------------------------

  /**
   * Verify ALL role-required fields are present. Throw 422 with a structured
   * `missingFields` list when not. Otherwise atomically flip
   * `signupCompleted: true` plus the role-profile's `onboardingCompleted: true`
   * (deprecated alias kept for one phase) and return the user.
   */
  async finishSignup(userId: string): Promise<{
    user: UserAccount;
    signupState: SignupState;
  }> {
    const state = await this.getState(userId);
    if (state.signupCompleted) {
      return {
        user: (await this.userRepo.findOne({ where: { id: userId } }))!,
        signupState: state,
      };
    }
    if (state.nextStep !== null) {
      const missing = state.requiredSteps.filter(
        (s) => !state.completedSteps.includes(s),
      );
      throw new UnprocessableEntityException({
        code: 'INCOMPLETE_SIGNUP',
        message:
          'Some required steps are not yet complete. Finish them and try again.',
        missingFields: missing,
        nextStep: state.nextStep,
      });
    }

    const user = await this.dataSource.transaction(async (manager) => {
      const u = await manager.getRepository(UserAccount).findOne({
        where: { id: userId },
      });
      if (!u) throw new NotFoundException('User not found');
      u.signupCompleted = true;
      // Active by default once signup is done. Email-verification gating moves
      // off the AccountStatus rail in Phase 3 (EmailVerifiedGuard handles it).
      if (u.status === AccountStatus.PENDING) u.status = AccountStatus.ACTIVE;
      await manager.getRepository(UserAccount).save(u);

      // Mirror into the deprecated `onboarding_completed` alias on the role
      // profile so any code still reading it keeps working until Phase 4.
      if (u.selectedRole === SelectedRole.CUSTOMER) {
        const cp = await manager
          .getRepository(CustomerProfile)
          .findOne({ where: { customerId: userId } });
        if (cp) {
          cp.onboardingCompleted = true;
          cp.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
          await manager.getRepository(CustomerProfile).save(cp);
        }
      } else if (u.selectedRole === SelectedRole.WELPER) {
        const wp = await manager
          .getRepository(WelperProfile)
          .findOne({ where: { welperId: userId } });
        if (wp) {
          wp.onboardingCompleted = true;
          wp.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
          wp.profileVisibility = ProfileVisibility.PUBLIC;
          await manager.getRepository(WelperProfile).save(wp);
        }
      }
      return u;
    });

    const finalState = await this.getState(userId);
    return { user, signupState: finalState };
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------

  private async assertWelper(userId: string): Promise<UserAccount> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.selectedRole !== SelectedRole.WELPER) {
      throw new BadRequestException(
        'This step is only available to welpers. Pick a different role at step 1 or skip.',
      );
    }
    return user;
  }
}
