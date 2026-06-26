import { AccountStatus, AccountType } from '../user-management/entities/user-account.entity';
import { isWelperAccountMarketplaceEligible } from './welper-marketplace-eligibility.util';

describe('isWelperAccountMarketplaceEligible', () => {
  const eligible = {
    accountType: AccountType.WELPER,
    status: AccountStatus.ACTIVE,
    signupCompleted: true,
    emailVerified: true,
  };

  it('returns true for an active, verified welper with completed signup', () => {
    expect(isWelperAccountMarketplaceEligible(eligible)).toBe(true);
  });

  it('returns false when account is deactivated', () => {
    expect(
      isWelperAccountMarketplaceEligible({
        ...eligible,
        status: AccountStatus.DEACTIVATED,
      }),
    ).toBe(false);
  });

  it('returns false when account is suspended', () => {
    expect(
      isWelperAccountMarketplaceEligible({
        ...eligible,
        status: AccountStatus.SUSPENDED,
      }),
    ).toBe(false);
  });

  it('returns false when signup is incomplete', () => {
    expect(
      isWelperAccountMarketplaceEligible({
        ...eligible,
        signupCompleted: false,
      }),
    ).toBe(false);
  });

  it('returns false when email is not verified', () => {
    expect(
      isWelperAccountMarketplaceEligible({
        ...eligible,
        emailVerified: false,
      }),
    ).toBe(false);
  });

  it('returns false for non-welper accounts', () => {
    expect(
      isWelperAccountMarketplaceEligible({
        ...eligible,
        accountType: AccountType.CUSTOMER,
      }),
    ).toBe(false);
  });

  it('returns false when user is missing', () => {
    expect(isWelperAccountMarketplaceEligible(null)).toBe(false);
    expect(isWelperAccountMarketplaceEligible(undefined)).toBe(false);
  });
});
