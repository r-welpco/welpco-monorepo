/**
 * Global launch gate — mirrors BFF `PLATFORM_ACCESS_GATED`.
 * Set the same value on web (and NEXT_PUBLIC_* for client components).
 */
export function isPlatformAccessGated(): boolean {
  const raw =
    process.env.PLATFORM_ACCESS_GATED ??
    process.env.NEXT_PUBLIC_PLATFORM_ACCESS_GATED;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw === 'true' || raw === '1';
}

/** User may use the dashboard when signup is done and the global gate is off. */
export function hasPlatformAccess(user: { signupCompleted?: boolean }): boolean {
  if (user.signupCompleted !== true) return false;
  return !isPlatformAccessGated();
}

/** After signup finishes, always open the dashboard (setup checklist lives there). */
export function postSignupDestination(_user: {
  signupCompleted?: boolean;
}): '/dashboard' {
  return '/dashboard';
}
