import type { SignupStepName } from "@welpco/types";

/**
 * Day 15 — Phase 2 Dispatch A. Bidirectional mapping between the BFF's
 * `SignupStepName` (camelCase) and the URL slug (kebab-case) the wizard's
 * dynamic route consumes.
 *
 * Keep both maps in lockstep with the union literals in
 * `packages/types/src/domain/signup-state.type.ts`. The TS compiler enforces
 * the keys/values via the satisfies pattern below.
 */

const STEP_NAME_TO_SLUG = {
  selectRole: "select-role",
  identity: "identity",
  welperBio: "welper-bio",
  welperServiceArea: "welper-service-area",
  welperOffering: "welper-offering",
  welperAvailability: "welper-availability",
  welperBackgroundCheck: "background-check",
  welperPayout: "welper-payout",
  optionalProfile: "optional-profile",
} as const satisfies Record<SignupStepName, string>;

const SLUG_TO_STEP_NAME: Record<string, SignupStepName> = Object.fromEntries(
  Object.entries(STEP_NAME_TO_SLUG).map(([name, slug]) => [
    slug,
    name as SignupStepName,
  ]),
);

export function stepNameToSlug(name: SignupStepName): string {
  return STEP_NAME_TO_SLUG[name as keyof typeof STEP_NAME_TO_SLUG];
}

export function stepSlugToName(slug: string): SignupStepName | null {
  return SLUG_TO_STEP_NAME[slug] ?? null;
}
