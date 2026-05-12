export {};

/** Deduped refresh promise for NextAuth JWT callback (see lib/auth/config.ts). */
type WelpcoRefreshResult = { accessToken?: string; refreshToken?: string } | null | undefined;

declare global {
  // eslint-disable-next-line no-var -- TypeScript global augmentation
  var __welpcoRefreshByUserKey: Map<string, Promise<WelpcoRefreshResult>> | undefined;
}
