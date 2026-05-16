/**
 * When true, seed only reference data (taxonomy, content, holidays) — no test users or demo welpers.
 * Defaults to true when SEED_CONFIRM_PRODUCTION=yes.
 */
export function shouldSkipUserSeed(): boolean {
  if (process.env.SEED_SKIP_USERS === '1' || process.env.SEED_SKIP_USERS === 'true') {
    return true;
  }
  if (process.env.SEED_SKIP_USERS === '0' || process.env.SEED_SKIP_USERS === 'false') {
    return false;
  }
  return process.env.SEED_CONFIRM_PRODUCTION === 'yes';
}

export function isProductionLikeSeed(): boolean {
  const nodeEnv = process.env.NODE_ENV ?? 'development';
  const dbName = process.env.DB_DATABASE ?? 'welpco_dev';
  return (
    nodeEnv === 'production' ||
    /prod/i.test(dbName) ||
    process.env.SEED_ENV === 'production'
  );
}
