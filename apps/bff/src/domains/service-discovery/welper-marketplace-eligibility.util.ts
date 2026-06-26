import type { SelectQueryBuilder } from 'typeorm';
import {
  AccountStatus,
  AccountType,
  UserAccount,
} from '../user-management/entities/user-account.entity';
import type { WelperProfile } from '../profile-management/entities/welper-profile.entity';

/** Mirrors admin "discoverable": active welper account with verified email and completed signup. */
export function isWelperAccountMarketplaceEligible(
  user: Pick<UserAccount, 'accountType' | 'status' | 'signupCompleted' | 'emailVerified'> | null | undefined,
): boolean {
  if (!user) return false;
  return (
    user.accountType === AccountType.WELPER &&
    user.status === AccountStatus.ACTIVE &&
    user.signupCompleted === true &&
    user.emailVerified === true
  );
}

/** Restrict search results to welpers eligible for the public marketplace. */
export function applyMarketplaceAccountFilters(
  qb: SelectQueryBuilder<WelperProfile>,
): SelectQueryBuilder<WelperProfile> {
  return qb
    .innerJoin(UserAccount, 'u', 'u.id = p.welper_id')
    .andWhere('u.account_type = :marketplaceWelperType', {
      marketplaceWelperType: AccountType.WELPER,
    })
    .andWhere('u.status = :marketplaceActiveStatus', {
      marketplaceActiveStatus: AccountStatus.ACTIVE,
    })
    .andWhere('u.signup_completed = true')
    .andWhere('u.email_verified = true');
}
