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

/** Welper steps completed on the dashboard after the 3-step signup wizard. */
export const WELPER_DEFERRED_SETUP_STEPS: SignupStepName[] = [
  "welperServiceArea",
  "welperOffering",
  "welperAvailability",
  "welperBackgroundCheck",
  "welperPayout",
  "optionalProfile",
];

export function isDeferredWelperSetupStep(step: SignupStepName): boolean {
  return WELPER_DEFERRED_SETUP_STEPS.includes(step);
}

/** Minimal shape for redirect decisions (signup state or checklist). */
export interface WelperSignupRedirectState {
  selectedRole: "customer" | "welper" | null;
  signupCompleted: boolean;
  nextStep: SignupStepName | null;
}

/**
 * Welpers who hit an old wizard URL (step 4+) or have stale `nextStep` pointing at
 * a deferred step should leave `/register` for the dashboard, not see "Coming soon".
 */
export function getWelperRegisterEscapeTarget(
  state: WelperSignupRedirectState,
  currentStep: SignupStepName | null,
): "dashboard" | null {
  if (state.selectedRole !== "welper") return null;
  if (state.signupCompleted) return "dashboard";
  if (currentStep && isDeferredWelperSetupStep(currentStep)) return "dashboard";
  if (state.nextStep && isDeferredWelperSetupStep(state.nextStep)) return "dashboard";
  if (state.nextStep === null) return "dashboard";
  return null;
}

/** True when 422 only lists post-signup setup tasks (legacy BFF or stale client). */
export function isOnlyDeferredSetupMissing(
  missingFields: string[] | undefined,
): boolean {
  if (!missingFields?.length) return false;
  return missingFields.every((field) =>
    WELPER_DEFERRED_SETUP_STEPS.includes(field as SignupStepName),
  );
}
