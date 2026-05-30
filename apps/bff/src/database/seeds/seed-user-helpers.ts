import {
  UserAccount,
  AccountType,
  AccountStatus,
  SelectedRole,
} from '../../domains/user-management/entities/user-account.entity';
import { CustomerProfile } from '../../domains/profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../../domains/profile-management/entities/welper-profile.entity';
import { ProfileCompletionStatus } from '../../domains/profile-management/entities/profile-completion-status.enum';
import { ProfileVisibility } from '../../domains/profile-management/entities/profile-visibility.enum';
import { PayoutMethodChoice } from '../../domains/profile-management/entities/payout-method-choice.enum';
import {
  BackgroundCheckStatus,
  VerificationStatus,
} from '../../domains/user-management/entities/verification-status.entity';
import type { PhoneNumber } from '../../common/types';
import type { DataSource } from 'typeorm';

/** Default phone for seeded accounts that must pass signup identity checks. */
export const SEED_DEFAULT_PHONE: PhoneNumber = {
  countryCode: '+1',
  number: '4165550100',
  formatted: '+1 (416) 555-0100',
};

export type SeedUserReadyOptions = {
  /** User can access dashboard (skips wizard). */
  signupCompleted?: boolean;
  /** Dashboard access after signup; defaults to true when signupCompleted. */
  platformAccessEnabled?: boolean;
  /** @deprecated Prefer `signupCompleted`. Kept for existing seed call sites. */
  onboardingCompleted?: boolean;
};

export function selectedRoleForAccountType(
  accountType: AccountType,
): SelectedRole | null {
  if (accountType === AccountType.CUSTOMER) return SelectedRole.CUSTOMER;
  if (accountType === AccountType.WELPER) return SelectedRole.WELPER;
  return null;
}

export function resolveSeedUserReadyFlags(options?: SeedUserReadyOptions): {
  signupCompleted: boolean;
  platformAccessEnabled: boolean;
} {
  const signupCompleted =
    options?.signupCompleted === true || options?.onboardingCompleted === true;
  return {
    signupCompleted,
    platformAccessEnabled: options?.platformAccessEnabled ?? true,
  };
}

/** Apply signup-merge fields on `user_accounts` (role, completion, platform access). */
export function applySeedUserAccountFields(
  user: UserAccount,
  accountType: AccountType,
  options?: SeedUserReadyOptions,
): void {
  const role = selectedRoleForAccountType(accountType);
  if (role) {
    user.selectedRole = role;
  }

  const { signupCompleted, platformAccessEnabled } =
    resolveSeedUserReadyFlags(options);

  user.platformAccessEnabled = platformAccessEnabled;

  if (signupCompleted) {
    user.signupCompleted = true;
    if (user.status === AccountStatus.PENDING) {
      user.status = AccountStatus.ACTIVE;
    }
  } else if (role) {
    // Wizard demo accounts: keep role but remain in the signup flow.
    user.signupCompleted = false;
  }
}

const SEED_WELPER_BIO =
  'Experienced Welper on Welpco. I offer reliable, friendly service in my community with flexible scheduling and clear communication from booking through completion.';

/** Mirror `finishSignup` profile updates for seeded ready accounts. */
export function applySeedCustomerProfileReady(
  profile: CustomerProfile,
  displayName?: { firstName: string; lastName: string },
): void {
  profile.firstName = displayName?.firstName ?? profile.firstName ?? 'Test';
  profile.lastName = displayName?.lastName ?? profile.lastName ?? 'Customer';
  if (!profile.phoneNumber) {
    profile.phoneNumber = SEED_DEFAULT_PHONE;
  }
  if (!profile.dateOfBirth) {
    profile.dateOfBirth = new Date('1990-06-15');
  }
  if (!profile.tosAcceptedAt) {
    profile.tosAcceptedAt = new Date();
  }
  if (!profile.privacyAcceptedAt) {
    profile.privacyAcceptedAt = new Date();
  }
  profile.onboardingCompleted = true;
  profile.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
  profile.optionalProfileStepCompletedAt =
    profile.optionalProfileStepCompletedAt ?? new Date();
}

/** Mirror `finishSignup` welper profile updates for seeded ready accounts. */
export function applySeedWelperProfileReady(
  profile: WelperProfile,
  displayName?: { firstName: string; lastName: string },
): void {
  profile.firstName = displayName?.firstName ?? profile.firstName ?? 'Test';
  profile.lastName = displayName?.lastName ?? profile.lastName ?? 'Welper';
  if (!profile.phoneNumber) {
    profile.phoneNumber = SEED_DEFAULT_PHONE;
  }
  if (!profile.dateOfBirth) {
    profile.dateOfBirth = new Date('1990-06-15');
  }
  if (!profile.tosAcceptedAt) {
    profile.tosAcceptedAt = new Date();
  }
  if (!profile.privacyAcceptedAt) {
    profile.privacyAcceptedAt = new Date();
  }
  if (!profile.bio || profile.bio.length < 20) {
    profile.bio = SEED_WELPER_BIO;
  }
  profile.onboardingCompleted = true;
  profile.profileCompletionStatus = ProfileCompletionStatus.COMPLETE;
  profile.profileVisibility = ProfileVisibility.PUBLIC;
  profile.optionalProfileStepCompletedAt =
    profile.optionalProfileStepCompletedAt ?? new Date();
  profile.backgroundCheckStepAcknowledgedAt =
    profile.backgroundCheckStepAcknowledgedAt ?? new Date();
  profile.payoutMethodChoice = PayoutMethodChoice.STRIPE;
  profile.availabilityAdHocOnly = profile.availabilityAdHocOnly || true;
}

/** Mark a seeded welper as background-check Passed so search shows the verified badge. */
export async function ensureSeedWelperBackgroundCheckPassed(
  dataSource: DataSource,
  userId: string,
): Promise<void> {
  const verificationRepository = dataSource.getRepository(VerificationStatus);
  let verification = await verificationRepository.findOne({ where: { userId } });
  if (!verification) {
    verification = verificationRepository.create({
      userId,
      emailVerified: true,
      backgroundCheckStatus: BackgroundCheckStatus.PASSED,
      verificationDate: new Date(),
    });
  } else {
    verification.backgroundCheckStatus = BackgroundCheckStatus.PASSED;
    verification.verificationDate = verification.verificationDate ?? new Date();
  }
  await verificationRepository.save(verification);
}

/** Mark marketplace-only welper rows searchable without full signup wizard data. */
export function applySeedMarketplaceWelperUser(user: UserAccount): void {
  user.selectedRole = SelectedRole.WELPER;
  user.signupCompleted = true;
  user.platformAccessEnabled = true;
  if (user.status === AccountStatus.PENDING) {
    user.status = AccountStatus.ACTIVE;
  }
}
