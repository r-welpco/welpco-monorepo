import {
  Injectable,
  Inject,
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
import { BackgroundCheckService } from '../../safety-verification/background-check.service';
import { GuardianConsentService } from '../../safety-verification/guardian-consent.service';
import { StripeConnectService } from '../../payment/stripe-connect.service';
import { platformAccessEnabledForClients } from '../../../common/platform-access';
import { resolvePreferredLocale } from '../../../common/preferred-locale';
import { applyPreferredLocaleIfProvided } from './user-locale.helper';
import { calculateAgeUtc, isAdultWelper } from '../../safety-verification/background-check-age.util';
import { GEOCODE_SERVICE } from '../../geocode/geocode.interface';
import {
  WELPER_SIGNUP_BIO_MIN_LENGTH,
} from './signup.constants';
import type { IGeocodeService } from '../../geocode/geocode.interface';
import {
  applyRadiusServiceAreaToWelperProfile,
  buildWelperServiceAreaFilledData,
  isWelperServiceAreaStepComplete,
  syncWelperServiceAreaColumnsFromJson,
  type RadiusServiceAreaPayload,
} from '../../profile-management/welper-profile/service-area-radius.util';

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
  | 'welperBackgroundCheck'
  | 'welperPayout'
  | 'optionalProfile'
  | 'customerPayment';

export interface SignupFilledData {
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
    radiusKm?: number;
    serviceArea?: RadiusServiceAreaPayload;
  };
  welperOffering?: {
    offerings: Array<{
      subcategoryId: string;
      title: string;
      hourlyRate: number;
      description: string;
    }>;
  };
  welperAvailability?: {
    weeklySlots?: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    acceptsAdHocOnly?: boolean;
  };
  welperBackgroundCheck?: {
    paid: boolean;
    certnStatus: string;
    applicantUrl?: string;
    listPriceCents: number;
    promoPriceCents: number;
    promoEnabled: boolean;
    skipped?: boolean;
  };
  welperGuardian?: {
    status: string | null;
    guardianFullName: string | null;
    guardianEmail: string | null;
    signupStepComplete: boolean;
  };
  welperPayout?: {
    stripeOnboardingCompleted?: boolean;
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

export interface BeginSignupResult {
  accessToken: string;
  refreshToken: string;
  signupState: SignupState;
}

/** Wizard steps required before `finishSignup` and dashboard access. */
export const CUSTOMER_SIGNUP_REQUIRED_STEPS: SignupStepName[] = [
  'selectRole',
  'identity',
];

/** Completed on the platform after signup (dashboard checklist). */
export const CUSTOMER_SETUP_TASKS = [
  'optionalProfile',
  'customerPayment',
] as const satisfies readonly SignupStepName[];

/** Wizard steps required before `finishSignup` and dashboard access. */
export const WELPER_SIGNUP_REQUIRED_STEPS: SignupStepName[] = [
  'selectRole',
  'identity',
  'welperBio',
];

/** Completed on the platform after signup (dashboard checklist). */
export const WELPER_SETUP_TASKS = [
  'welperServiceArea',
  'welperOffering',
  'welperAvailability',
  'welperBackgroundCheck',
  'welperPayout',
  'optionalProfile',
] as const satisfies readonly SignupStepName[];

export type WelperSetupTaskId =
  | 'emailVerification'
  | (typeof WELPER_SETUP_TASKS)[number]
  | 'welperGuardian';

export interface WelperSetupTask {
  id: WelperSetupTaskId;
  label: string;
  completed: boolean;
  required: boolean;
  href: string;
  blockingReason?: string;
}

export type CustomerSetupTaskId =
  | 'emailVerification'
  | (typeof CUSTOMER_SETUP_TASKS)[number];

export interface CustomerSetupTask {
  id: CustomerSetupTaskId;
  label: string;
  completed: boolean;
  required: boolean;
  href: string;
  blockingReason?: string;
}

export interface SignupState {
  userId: string;
  email: string;
  signupCompleted: boolean;
  platformAccessEnabled: boolean;
  emailVerified: boolean;
  selectedRole: SelectedRole | null;
  completedSteps: SignupStepName[];
  nextStep: SignupStepName | null;
  requiredSteps: SignupStepName[];
  filledData: SignupFilledData;
  setupTasks?: WelperSetupTask[] | CustomerSetupTask[];
  setupComplete?: boolean;
  /** All checklist tasks complete, including optional background check and payout. */
  allSetupComplete?: boolean;
  discoverable?: boolean;
}

const SETUP_TASK_META: Record<
  (typeof WELPER_SETUP_TASKS)[number] | 'welperGuardian',
  { label: string; href: string; required: boolean }
> = {
  welperServiceArea: {
    label: 'Service area',
    href: '/dashboard/profile?tab=serviceArea',
    required: true,
  },
  welperOffering: {
    label: 'Service offerings',
    href: '/dashboard/profile?tab=offerings',
    required: true,
  },
  welperAvailability: {
    label: 'Availability',
    href: '/dashboard/profile?tab=availability',
    required: true,
  },
  welperBackgroundCheck: {
    label: 'Background check',
    href: '/dashboard/profile?tab=backgroundCheck',
    required: false,
  },
  welperGuardian: {
    label: 'Guardian approval',
    href: '/dashboard/profile?tab=guardian',
    required: false,
  },
  welperPayout: {
    label: 'Payout setup',
    href: '/dashboard/profile?tab=payout',
    required: false,
  },
  optionalProfile: {
    label: 'Profile photo',
    href: '/dashboard/profile?tab=profile',
    required: true,
  },
};

const CUSTOMER_SETUP_TASK_META: Record<
  (typeof CUSTOMER_SETUP_TASKS)[number],
  { label: string; href: string; required: boolean }
> = {
  optionalProfile: {
    label: 'Home address',
    href: '/dashboard/profile?tab=profile',
    required: true,
  },
  customerPayment: {
    label: 'Payment method',
    href: '/dashboard/settings?tab=payment',
    required: true,
  },
};

@Injectable()
export class SignupOrchestratorService {
  private readonly logger = new Logger(SignupOrchestratorService.name);
  private readonly saltRounds = 12;

  private formatOfferingDescription(title: string, description: string): string {
    const t = title.trim();
    const d = description.trim();
    if (!t) return d;
    if (d.startsWith(`${t}\n\n`)) return d;
    return `${t}\n\n${d}`;
  }

  private parseOfferingDescription(desc: string): {
    title: string;
    description: string;
  } {
    const idx = desc.indexOf('\n\n');
    if (idx > 0 && idx <= 120) {
      return {
        title: desc.slice(0, idx).trim(),
        description: desc.slice(idx + 2).trim(),
      };
    }
    return { title: '', description: desc };
  }

  /** ISO calendar date for Postgres `date` columns (UTC components — avoids TZ drift). */
  private formatDateOnly(d: Date | string): string {
    if (typeof d === 'string') {
      return d.slice(0, 10);
    }
    const date = d instanceof Date ? d : new Date(d);
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
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
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly guardianConsentService: GuardianConsentService,
    private readonly stripeConnectService: StripeConnectService,
    @Inject(GEOCODE_SERVICE)
    private readonly geocodeService: IGeocodeService,
  ) {}

  // ---------------------------------------------------------------------
  // Required-fields contract
  // ---------------------------------------------------------------------

  /**
   * Returns the canonical step list for a given role. Exposed for spec /
   * controller use; the orchestrator's `getState` wires it through.
   */
  getRequiredStepsForRole(role: SelectedRole | null): SignupStepName[] {
    if (role === SelectedRole.WELPER) return [...WELPER_SIGNUP_REQUIRED_STEPS];
    if (role === SelectedRole.CUSTOMER) return [...CUSTOMER_SIGNUP_REQUIRED_STEPS];
    // Role not yet selected — only the role-pick step matters next.
    return ['selectRole'];
  }

  /**
   * Customer dashboard setup checklist (same rules as `getState` setupTasks).
   */
  async getCustomerSetupChecklist(userId: string): Promise<{
    setupTasks: CustomerSetupTask[];
    setupComplete: boolean;
  }> {
    await this.assertCustomer(userId);
    const state = await this.getState(userId);
    const setupTasks = (state.setupTasks ?? []) as CustomerSetupTask[];
    const setupComplete = setupTasks
      .filter((t) => t.required)
      .every((t) => t.completed);
    return { setupTasks, setupComplete };
  }

  /**
   * Welper dashboard setup checklist (same rules as `getState` setupTasks).
   */
  async getWelperSetupChecklist(userId: string): Promise<{
    setupTasks: WelperSetupTask[];
    setupComplete: boolean;
    allSetupComplete: boolean;
    discoverable: boolean;
    isMinorWelper: boolean;
  }> {
    await this.assertWelper(userId);

    let stripePayoutComplete = false;
    try {
      const stripe = await this.stripeConnectService.getStatus(userId);
      stripePayoutComplete = stripe.onboardingComplete;
    } catch (err) {
      this.logger.warn(
        `Stripe Connect status unavailable for setup checklist ${userId}: ${(err as Error).message}`,
      );
    }

    const state = await this.getState(userId);
    const setupTasks = (state.setupTasks ?? []).map((task) =>
      task.id === 'welperPayout'
        ? { ...task, completed: stripePayoutComplete || task.completed }
        : task,
    );
    const setupComplete = setupTasks
      .filter((t) => t.required)
      .every((t) => t.completed);
    const allSetupComplete = setupTasks.every((t) => t.completed);

    return {
      setupTasks,
      setupComplete,
      allSetupComplete,
      discoverable: state.discoverable ?? false,
      isMinorWelper: await this.guardianConsentService.isMinorWelper(userId),
    };
  }

  /** Called after guardian approval to refresh profile visibility. */
  async refreshWelperDiscoverability(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.selectedRole !== SelectedRole.WELPER) return;
    const welper = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    const state = await this.getState(userId);
    const completed = new Set<SignupStepName>([
      ...state.completedSteps,
      ...(state.setupTasks
        ?.filter((t) => t.completed && t.id !== 'emailVerification')
        .map((t) => t.id as SignupStepName) ?? []),
    ]);
    await this.maybeRefreshWelperDiscoverability(userId, welper, completed, {
      isMinorWelper: await this.guardianConsentService.isMinorWelper(userId),
      guardianApproved: await this.guardianConsentService.hasApprovedConsent(userId),
    });
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
      if (applyPreferredLocaleIfProvided(existing, dto.preferredLocale)) {
        await this.userRepo.save(existing);
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
        preferredLocale: resolvePreferredLocale(dto.preferredLocale),
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
      if (this.isCustomerOptionalProfileComplete(customer)) {
        completed.add('optionalProfile');
        filledData.optionalProfile = {
          photoUrl: customer!.profilePhotoUrl ?? undefined,
          address: customer!.address
            ? ({ ...customer!.address } as unknown as Record<
                string,
                string | undefined
              >)
            : undefined,
        };
      }
      if (user.stripeDefaultPaymentMethodId) {
        completed.add('customerPayment');
      }
    } else if (role === SelectedRole.WELPER) {
      welper = await this.welperProfileRepo.findOne({
        where: { welperId: userId },
      });
      if (welper && syncWelperServiceAreaColumnsFromJson(welper)) {
        welper = await this.welperProfileRepo.save(welper);
      }
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
      if (welper?.bio && welper.bio.length >= WELPER_SIGNUP_BIO_MIN_LENGTH) {
        completed.add('welperBio');
        filledData.welperBio = { bio: welper.bio };
      }
      if (welper && isWelperServiceAreaStepComplete(welper)) {
        completed.add('welperServiceArea');
        filledData.welperServiceArea = buildWelperServiceAreaFilledData(welper);
      }
      const offerings = await this.serviceOfferingRepo.find({
        where: { welperId: userId, active: true },
        order: { createdAt: 'ASC' },
      });
      if (offerings.length > 0) {
        completed.add('welperOffering');
        filledData.welperOffering = {
          offerings: offerings.map((offering) => {
            const parsed = this.parseOfferingDescription(
              offering.serviceDescription,
            );
            return {
              subcategoryId: offering.serviceCategoryId,
              title: parsed.title,
              hourlyRate: Number(offering.hourlyRate),
              description: parsed.description,
            };
          }),
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
      try {
        if (welper?.dateOfBirth && !isAdultWelper(welper.dateOfBirth)) {
          await this.backgroundCheckService.skipForMinor(userId);
          filledData.welperBackgroundCheck = {
            paid: false,
            certnStatus: 'not_required',
            listPriceCents: 0,
            promoPriceCents: 0,
            promoEnabled: false,
            skipped: true,
          };
          const guardianStatus = await this.guardianConsentService.getStatus(userId);
          filledData.welperGuardian = {
            status: guardianStatus.status,
            guardianFullName: guardianStatus.guardianFullName,
            guardianEmail: guardianStatus.guardianEmail,
            signupStepComplete: guardianStatus.signupStepComplete,
          };
        } else if (welper?.dateOfBirth && isAdultWelper(welper.dateOfBirth)) {
          if (await this.backgroundCheckService.isAdminBackgroundCheckApproved(userId)) {
            completed.add('welperBackgroundCheck');
          }
          filledData.welperBackgroundCheck =
            await this.backgroundCheckService.getFilledData(userId);
        } else if (role === SelectedRole.WELPER) {
          // Adult path but DOB missing on profile — still surface pricing defaults.
          filledData.welperBackgroundCheck =
            await this.backgroundCheckService.getFilledData(userId);
        }
      } catch (err) {
        this.logger.warn(
          `Background check signup state skipped for ${userId}: ${(err as Error).message}`,
        );
        filledData.welperBackgroundCheck = {
          paid: false,
          certnStatus: 'not_started',
          listPriceCents: 1999,
          promoPriceCents: 1999,
          promoEnabled: false,
        };
      }
      if (welper?.profilePhotoUrl) {
        completed.add('optionalProfile');
        filledData.optionalProfile = {
          photoUrl: welper.profilePhotoUrl,
        };
      }
      if (
        welper &&
        (welper.payoutMethodChoice === PayoutMethodChoice.STRIPE ||
          (await this.stripeConnectService
            .isOnboardingComplete(userId)
            .catch(() => false)))
      ) {
        completed.add('welperPayout');
        filledData.welperPayout = {
          stripeOnboardingCompleted: true,
        };
      }
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

    let setupTasks: WelperSetupTask[] | CustomerSetupTask[] | undefined;
    let setupComplete: boolean | undefined;
    let allSetupComplete: boolean | undefined;
    let discoverable: boolean | undefined;

    if (role === SelectedRole.CUSTOMER) {
      if (user.signupCompleted) {
        await this.maybeRefreshCustomerProfileCompletion(userId, customer, completed);
        customer =
          (await this.customerProfileRepo.findOne({
            where: { customerId: userId },
          })) ?? customer;
      }
      setupTasks = this.buildCustomerSetupTasks(completed, user.emailVerified);
      setupComplete = setupTasks
        .filter((t) => t.required)
        .every((t) => t.completed);
    } else if (role === SelectedRole.WELPER) {
      const isMinorWelper =
        !!welper?.dateOfBirth && !isAdultWelper(welper.dateOfBirth);
      const guardianApproved = isMinorWelper
        ? await this.guardianConsentService.hasApprovedConsent(userId)
        : true;
      const setupOptions = { isMinorWelper, guardianApproved };

      if (user.signupCompleted) {
        await this.maybeRefreshWelperDiscoverability(
          userId,
          welper,
          completed,
          setupOptions,
        );
        welper =
          (await this.welperProfileRepo.findOne({
            where: { welperId: userId },
          })) ?? welper;
      }
      setupTasks = this.buildSetupTasks(
        completed,
        user.emailVerified,
        setupOptions,
      );
      setupComplete = setupTasks
        .filter((t) => t.required)
        .every((t) => t.completed);
      allSetupComplete = setupTasks.every((t) => t.completed);
      const profileComplete =
        welper?.profileCompletionStatus === ProfileCompletionStatus.COMPLETE;
      discoverable =
        user.signupCompleted === true &&
        profileComplete === true &&
        setupComplete === true &&
        guardianApproved;
    }

    return {
      userId: user.id,
      email: user.email,
      signupCompleted: user.signupCompleted,
      platformAccessEnabled: platformAccessEnabledForClients(),
      emailVerified: user.emailVerified,
      selectedRole: user.selectedRole,
      completedSteps,
      nextStep,
      requiredSteps,
      filledData,
      setupTasks,
      setupComplete,
      allSetupComplete,
      discoverable,
    };
  }

  // ---------------------------------------------------------------------
  // Per-step writers
  // ---------------------------------------------------------------------

  /**
   * Step: selectRole. Locks the role after identity is submitted; before that
   * the user may return from the identity step and pick a different role.
   */
  async submitSelectRoleStep(
    userId: string,
    dto: SelectRoleStepDto,
  ): Promise<SignupState> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.selectedRole && user.selectedRole !== dto.role) {
      const signupState = await this.getState(userId);
      if (signupState.completedSteps.includes('identity')) {
        throw new ConflictException({
          code: 'ROLE_LOCKED',
          message:
            'Role is already set for this account and cannot be changed mid-signup.',
        });
      }
      await this.dataSource.transaction(async (manager) => {
        user.selectedRole = dto.role;
        user.accountType =
          dto.role === SelectedRole.WELPER
            ? AccountType.WELPER
            : AccountType.CUSTOMER;
        user.authVersion = (user.authVersion ?? 0) + 1;
        await manager.getRepository(UserAccount).save(user);
        if (dto.role === SelectedRole.WELPER) {
          await manager.getRepository(CustomerProfile).delete({
            customerId: user.id,
          });
        } else {
          await manager.getRepository(WelperProfile).delete({
            welperId: user.id,
          });
        }
        await this.profileCreationService.createProfileForUser(
          user.id,
          user.email,
          user.accountType,
          manager,
        );
      });
      return this.getState(userId);
    }
    if (!user.selectedRole) {
      await this.dataSource.transaction(async (manager) => {
        user.selectedRole = dto.role;
        // Mirror the wizard role into the legacy taxonomy.
        user.accountType =
          dto.role === SelectedRole.WELPER
            ? AccountType.WELPER
            : AccountType.CUSTOMER;
        user.authVersion = (user.authVersion ?? 0) + 1;
        await manager.getRepository(UserAccount).save(user);
        if (dto.role === SelectedRole.WELPER) {
          await manager.getRepository(CustomerProfile).delete({
            customerId: user.id,
          });
        } else {
          await manager.getRepository(WelperProfile).delete({
            welperId: user.id,
          });
        }
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
    const age = calculateAgeUtc(dto.dateOfBirth);
    if (age === null) {
      throw new BadRequestException('Invalid date of birth');
    }
    if (user.selectedRole === SelectedRole.CUSTOMER && age < 18) {
      throw new BadRequestException('You must be at least 18 years old to sign up');
    }
    if (user.selectedRole === SelectedRole.WELPER && age < 14) {
      throw new BadRequestException(
        'You must be at least 14 years old to sign up as a Welper',
      );
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
    await applyRadiusServiceAreaToWelperProfile(
      profile,
      dto.serviceArea as RadiusServiceAreaPayload,
      this.geocodeService,
      this.logger,
    );
    await this.welperProfileRepo.save(profile);
    await this.afterWelperSetupStepWrite(userId);
    return this.getState(userId);
  }

  async submitWelperOfferingStep(
    userId: string,
    dto: WelperOfferingStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(ServiceOffering);
      await repo.update({ welperId: userId }, { active: false });
      for (const item of dto.offerings) {
        const offering = repo.create({
          welperId: userId,
          serviceCategoryId: item.subcategoryId,
          hourlyRate: item.hourlyRate,
          serviceDescription: this.formatOfferingDescription(
            item.title,
            item.description,
          ),
          experienceYears: 0,
          active: true,
          subcategoryIds: [item.subcategoryId],
        });
        await repo.save(offering);
      }
    });
    await this.afterWelperSetupStepWrite(userId);
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
    await this.afterWelperSetupStepWrite(userId);
    return this.getState(userId);
  }

  async submitWelperBackgroundCheckStep(userId: string): Promise<SignupState> {
    await this.assertWelper(userId);
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) throw new NotFoundException('Welper profile missing');

    if (!(await this.backgroundCheckService.isBackgroundCheckRequiredForUser(userId))) {
      return this.getState(userId);
    }

    const paid = await this.backgroundCheckService.isSignupStepComplete(userId);
    if (!paid) {
      throw new BadRequestException('Pay the background check fee before continuing.');
    }

    profile.backgroundCheckStepAcknowledgedAt = new Date();
    await this.welperProfileRepo.save(profile);
    await this.afterWelperSetupStepWrite(userId);
    return this.getState(userId);
  }

  async submitWelperPayoutStep(
    userId: string,
    dto: WelperPayoutStepDto,
  ): Promise<SignupState> {
    await this.assertWelper(userId);
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) throw new NotFoundException('Welper profile missing');

    if (dto.stripeOnboardingCompleted !== true) {
      throw new BadRequestException(
        'stripeOnboardingCompleted must be true to complete the payout step.',
      );
    }

    const complete = await this.stripeConnectService.isOnboardingComplete(userId);
    if (!complete) {
      throw new BadRequestException(
        'Finish Stripe Connect onboarding before continuing.',
      );
    }

    profile.payoutMethodChoice = PayoutMethodChoice.STRIPE;
    await this.welperProfileRepo.save(profile);
    await this.afterWelperSetupStepWrite(userId);
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
      await this.afterCustomerSetupStepWrite(userId);
    } else {
      const profile = await this.welperProfileRepo.findOne({
        where: { welperId: userId },
      });
      if (!profile) throw new NotFoundException('Welper profile missing');
      if (dto.skipped || !dto.photoUrl?.trim()) {
        throw new BadRequestException({
          code: 'PROFILE_PHOTO_REQUIRED',
          message: 'A profile photo is required before you can continue.',
        });
      }
      profile.profilePhotoUrl = dto.photoUrl.trim();
      profile.optionalProfileStepCompletedAt = new Date();
      await this.welperProfileRepo.save(profile);
      await this.afterWelperSetupStepWrite(userId);
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

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    // Welper/customer: only signup wizard steps gate finish — dashboard setup tasks never block.
    const missingSignup =
      user.selectedRole === SelectedRole.WELPER
        ? WELPER_SIGNUP_REQUIRED_STEPS.filter(
            (s) => !state.completedSteps.includes(s),
          )
        : user.selectedRole === SelectedRole.CUSTOMER
          ? CUSTOMER_SIGNUP_REQUIRED_STEPS.filter(
              (s) => !state.completedSteps.includes(s),
            )
          : this.getRequiredStepsForRole(user.selectedRole).filter(
              (s) => !state.completedSteps.includes(s),
            );
    if (missingSignup.length > 0) {
      throw new UnprocessableEntityException({
        code: 'INCOMPLETE_SIGNUP',
        message:
          'Some required signup steps are not yet complete. Finish them and try again.',
        missingFields: missingSignup,
        nextStep: missingSignup[0] ?? null,
      });
    }

    const savedUser = await this.dataSource.transaction(async (manager) => {
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
          cp.profileCompletionStatus =
            await this.computeCustomerProfileCompletionStatus(userId, cp);
          await manager.getRepository(CustomerProfile).save(cp);
        }
      } else if (u.selectedRole === SelectedRole.WELPER) {
        const wp = await manager
          .getRepository(WelperProfile)
          .findOne({ where: { welperId: userId } });
        if (wp) {
          wp.onboardingCompleted = true;
          wp.profileCompletionStatus =
            await this.computeWelperProfileCompletionStatus(userId, wp);
          wp.profileVisibility = ProfileVisibility.PRIVATE;
          await manager.getRepository(WelperProfile).save(wp);
        }
      }
      return u;
    });

    const finalState = await this.getState(userId);
    return { user: savedUser, signupState: finalState };
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

  private async assertCustomer(userId: string): Promise<UserAccount> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.selectedRole !== SelectedRole.CUSTOMER) {
      throw new BadRequestException(
        'This step is only available to customers.',
      );
    }
    return user;
  }

  private isCustomerOptionalProfileComplete(
    customer: CustomerProfile | null,
  ): boolean {
    return Boolean(customer?.address?.streetAddress?.trim());
  }

  private buildCustomerSetupTasks(
    completed: Set<SignupStepName>,
    emailVerified: boolean,
  ): CustomerSetupTask[] {
    const emailTask: CustomerSetupTask = {
      id: 'emailVerification',
      label: 'Verify your email',
      href: '/verification',
      required: true,
      completed: emailVerified,
    };
    const profileTasks = CUSTOMER_SETUP_TASKS.map((id) => {
      const meta = CUSTOMER_SETUP_TASK_META[id];
      return {
        id,
        label: meta.label,
        href: meta.href,
        required: meta.required,
        completed: completed.has(id),
      };
    });
    return [emailTask, ...profileTasks];
  }

  private buildSetupTasks(
    completed: Set<SignupStepName>,
    emailVerified: boolean,
    options?: { isMinorWelper?: boolean; guardianApproved?: boolean },
  ): WelperSetupTask[] {
    const emailTask: WelperSetupTask = {
      id: 'emailVerification',
      label: 'Verify your email',
      href: '/verification',
      required: true,
      completed: emailVerified,
    };
    const dashboardTaskIds: Array<(typeof WELPER_SETUP_TASKS)[number] | 'welperGuardian'> =
      options?.isMinorWelper
        ? WELPER_SETUP_TASKS.map((id) =>
            id === 'welperBackgroundCheck' ? ('welperGuardian' as const) : id,
          )
        : [...WELPER_SETUP_TASKS];
    const profileTasks = dashboardTaskIds.map((id) => {
      const meta = SETUP_TASK_META[id];
      const taskCompleted =
        id === 'welperGuardian'
          ? (options?.guardianApproved ?? false)
          : completed.has(id as SignupStepName);
      return {
        id,
        label: meta.label,
        href: meta.href,
        required:
          id === 'welperGuardian' && options?.isMinorWelper ? true : meta.required,
        completed: taskCompleted,
      };
    });
    return [emailTask, ...profileTasks];
  }

  /** Mirrors `WelperProfileService.calculateCompletionStatus` without circular imports. */
  private async computeWelperProfileCompletionStatus(
    userId: string,
    profile: WelperProfile,
  ): Promise<ProfileCompletionStatus> {
    const hasRequiredFields =
      profile.firstName &&
      profile.lastName &&
      profile.phoneNumber &&
      profile.bio &&
      profile.profilePhotoUrl &&
      profile.serviceArea;

    const offerings = await this.serviceOfferingRepo.find({
      where: { welperId: userId },
    });
    const hasActiveOffering =
      offerings.length > 0 && offerings.some((o) => o.active);

    if (hasRequiredFields && hasActiveOffering) {
      return ProfileCompletionStatus.COMPLETE;
    }
    return ProfileCompletionStatus.INCOMPLETE;
  }

  /** Mirrors `CustomerProfileService.computeCompletionStatus` without circular imports. */
  private async computeCustomerProfileCompletionStatus(
    userId: string,
    profile: CustomerProfile,
  ): Promise<ProfileCompletionStatus> {
    if (
      !profile.firstName ||
      !profile.lastName ||
      !profile.phoneNumber ||
      !profile.address?.streetAddress?.trim()
    ) {
      return ProfileCompletionStatus.INCOMPLETE;
    }
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.stripeDefaultPaymentMethodId) {
      return ProfileCompletionStatus.INCOMPLETE;
    }
    return ProfileCompletionStatus.COMPLETE;
  }

  private async afterCustomerSetupStepWrite(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.signupCompleted) return;
    const profile = await this.customerProfileRepo.findOne({
      where: { customerId: userId },
    });
    if (!profile) return;
    const state = await this.getState(userId);
    const completed = new Set<SignupStepName>([
      ...state.completedSteps,
      ...(state.setupTasks
        ?.filter((t) => t.completed && t.id !== 'emailVerification')
        .map((t) => t.id as SignupStepName) ?? []),
    ]);
    await this.maybeRefreshCustomerProfileCompletion(userId, profile, completed);
  }

  private async maybeRefreshCustomerProfileCompletion(
    userId: string,
    profile: CustomerProfile | null,
    completed: Set<SignupStepName>,
  ): Promise<void> {
    if (!profile) return;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const setupTasks = this.buildCustomerSetupTasks(
      completed,
      user?.emailVerified ?? false,
    );
    const setupComplete = setupTasks
      .filter((t) => t.required)
      .every((t) => t.completed);

    profile.profileCompletionStatus =
      await this.computeCustomerProfileCompletionStatus(userId, profile);

    if (!setupComplete) {
      profile.profileCompletionStatus = ProfileCompletionStatus.INCOMPLETE;
    }

    await this.customerProfileRepo.save(profile);
  }

  private async afterWelperSetupStepWrite(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user?.signupCompleted) return;
    const profile = await this.welperProfileRepo.findOne({
      where: { welperId: userId },
    });
    if (!profile) return;
    const state = await this.getState(userId);
    const completed = new Set<SignupStepName>([
      ...state.completedSteps,
      ...(state.setupTasks
        ?.filter((t) => t.completed && t.id !== 'emailVerification')
        .map((t) => t.id as SignupStepName) ?? []),
    ]);
    await this.maybeRefreshWelperDiscoverability(userId, profile, completed);
  }

  /**
   * When all required setup tasks are done, mark profile complete and public.
   * Otherwise keep the welper private until setup finishes.
   */
  private async maybeRefreshWelperDiscoverability(
    userId: string,
    profile: WelperProfile | null,
    completed: Set<SignupStepName>,
    options?: { isMinorWelper?: boolean; guardianApproved?: boolean },
  ): Promise<void> {
    if (!profile) return;
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const isMinorWelper =
      options?.isMinorWelper ??
      (!!profile.dateOfBirth && !isAdultWelper(profile.dateOfBirth));
    const guardianApproved =
      options?.guardianApproved ??
      (isMinorWelper
        ? await this.guardianConsentService.hasApprovedConsent(userId)
        : true);
    const setupTasks = this.buildSetupTasks(
      completed,
      user?.emailVerified ?? false,
      { isMinorWelper, guardianApproved },
    );
    const setupComplete = setupTasks
      .filter((t) => t.required)
      .every((t) => t.completed);

    profile.profileCompletionStatus =
      await this.computeWelperProfileCompletionStatus(userId, profile);

    if (
      setupComplete &&
      profile.profileCompletionStatus === ProfileCompletionStatus.COMPLETE &&
      guardianApproved
    ) {
      profile.profileVisibility = ProfileVisibility.PUBLIC;
    } else {
      profile.profileVisibility = ProfileVisibility.PRIVATE;
    }

    await this.welperProfileRepo.save(profile);
  }
}
