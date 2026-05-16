/**
 * When true, users who finish signup cannot access the dashboard until
 * `platform_access_enabled` is set (bulk update or PLATFORM_ACCESS_GATED=false).
 */
export function isPlatformAccessGated(): boolean {
  const raw = process.env.PLATFORM_ACCESS_GATED;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw === 'true' || raw === '1';
}

/** Value written on `POST /auth/signup/finish` for new accounts. */
export function platformAccessEnabledOnFinish(): boolean {
  return !isPlatformAccessGated();
}
