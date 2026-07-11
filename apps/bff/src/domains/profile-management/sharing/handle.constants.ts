/**
 * SHARE-002: vanity-handle validation contract.
 *
 * Handles are lowercase, 3–30 chars, start with a letter/digit, then
 * letters/digits/hyphens. The reserved list blocks impersonation of platform
 * surfaces and route collisions on `welpco.com/…` — keep it in sync with the
 * web app's top-level routes when new ones ship.
 */
export const HANDLE_REGEX = /^[a-z0-9][a-z0-9-]{2,29}$/;

export const RESERVED_HANDLES: ReadonlySet<string> = new Set([
  'admin',
  'welpco',
  'support',
  'api',
  'search',
  'login',
  'register',
  'dashboard',
  'help',
  'legal',
  'about',
  'contact',
  'w',
  'welper',
  'terms',
  'privacy',
]);
