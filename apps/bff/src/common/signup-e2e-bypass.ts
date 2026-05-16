/** Header sent by Playwright signup tests to skip real Stripe/Certn (non-production only). */
export const SIGNUP_E2E_BYPASS_HEADER = 'x-welpco-signup-e2e';

export function parseSignupE2eBypassHeader(
  value: string | undefined,
): boolean {
  return value === '1' || value === 'true';
}

export function signupE2eBypassAllowed(e2eBypass: boolean): boolean {
  return e2eBypass && process.env.NODE_ENV !== 'production';
}

export const E2E_BG_CHECK_SESSION_PREFIX = 'e2e_bg_';
export const E2E_STRIPE_CONNECT_ACCOUNT_PREFIX = 'e2e_acct_';
