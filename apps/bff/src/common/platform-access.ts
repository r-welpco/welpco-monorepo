/**
 * Global launch gate — controlled only by PLATFORM_ACCESS_GATED (not per-user DB flags).
 *
 * When true (default), signed-up users cannot access the dashboard until you set
 * PLATFORM_ACCESS_GATED=false on the BFF (and matching env on the web app).
 */
export function isPlatformAccessGated(): boolean {
  const raw = process.env.PLATFORM_ACCESS_GATED;
  if (raw === undefined || raw === '') {
    return true;
  }
  return raw === 'true' || raw === '1';
}

/** Exposed on login/signup/session DTOs so clients can mirror the global gate. */
export function platformAccessEnabledForClients(): boolean {
  return !isPlatformAccessGated();
}
