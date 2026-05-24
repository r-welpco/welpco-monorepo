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
  customerPayment: "customer-payment",
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

export interface SignupStepNavState {
  requiredSteps: SignupStepName[];
  nextStep: SignupStepName | null;
}

/**
 * Whether the wizard may render this step: the current `nextStep`, any earlier
 * required step (for Back / browser back), or the final required step when all
 * signup steps are complete (review before `/register/finish`).
 */
export function isAllowedSignupStep(
  step: SignupStepName,
  state: SignupStepNavState,
): boolean {
  if (!state.requiredSteps.includes(step)) return false;
  if (state.nextStep === null) {
    const last = state.requiredSteps[state.requiredSteps.length - 1];
    return step === last;
  }
  if (state.nextStep === step) return true;
  const nextIdx = state.requiredSteps.indexOf(state.nextStep);
  const stepIdx = state.requiredSteps.indexOf(step);
  return stepIdx >= 0 && stepIdx < nextIdx;
}

export function getPreviousSignupStep(
  current: SignupStepName,
  requiredSteps: SignupStepName[],
): SignupStepName | null {
  const idx = requiredSteps.indexOf(current);
  if (idx <= 0) return null;
  return requiredSteps[idx - 1] ?? null;
}

/** In-wizard Back target. Identity may return to role selection before it is submitted. */
export function getSignupBackStep(
  current: SignupStepName,
  requiredSteps: SignupStepName[],
): SignupStepName | null {
  const prev = getPreviousSignupStep(current, requiredSteps);
  if (prev === "selectRole" && current !== "identity") return null;
  return prev;
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

/** Customer steps completed on the dashboard after the 2-step signup wizard. */
export const CUSTOMER_DEFERRED_SETUP_STEPS: SignupStepName[] = [
  "optionalProfile",
  "customerPayment",
];

export function isDeferredCustomerSetupStep(step: SignupStepName): boolean {
  return CUSTOMER_DEFERRED_SETUP_STEPS.includes(step);
}

/** Minimal shape for redirect decisions (signup state or checklist). */
export interface SignupRedirectState {
  selectedRole: "customer" | "welper" | null;
  signupCompleted: boolean;
  nextStep: SignupStepName | null;
}

/** @deprecated Use SignupRedirectState */
export type WelperSignupRedirectState = SignupRedirectState;

/**
 * Welpers who hit an old wizard URL (step 4+) or have stale `nextStep` pointing at
 * a deferred step should leave `/register` for the dashboard, not see "Coming soon".
 */
export function getWelperRegisterEscapeTarget(
  state: SignupRedirectState,
  currentStep: SignupStepName | null,
): "dashboard" | null {
  if (state.selectedRole !== "welper") return null;
  if (state.signupCompleted) return "dashboard";
  if (currentStep && isDeferredWelperSetupStep(currentStep)) return "dashboard";
  if (state.nextStep && isDeferredWelperSetupStep(state.nextStep)) return "dashboard";
  if (state.nextStep === null) return "dashboard";
  return null;
}

/**
 * Customers who hit a deferred step URL or have finished the 2-step wizard should
 * leave `/register` for the dashboard setup checklist.
 */
export function getCustomerRegisterEscapeTarget(
  state: SignupRedirectState,
  currentStep: SignupStepName | null,
): "dashboard" | null {
  if (state.selectedRole !== "customer") return null;
  if (state.signupCompleted) return "dashboard";
  if (currentStep && isDeferredCustomerSetupStep(currentStep)) return "dashboard";
  if (state.nextStep && isDeferredCustomerSetupStep(state.nextStep)) return "dashboard";
  if (state.nextStep === null) return "dashboard";
  return null;
}

export function getRegisterEscapeTarget(
  state: SignupRedirectState,
  currentStep: SignupStepName | null,
): "dashboard" | null {
  return (
    getWelperRegisterEscapeTarget(state, currentStep) ??
    getCustomerRegisterEscapeTarget(state, currentStep)
  );
}

/** True when 422 only lists post-signup setup tasks (legacy BFF or stale client). */
export function isOnlyDeferredSetupMissing(
  missingFields: string[] | undefined,
): boolean {
  if (!missingFields?.length) return false;
  const deferred = [...WELPER_DEFERRED_SETUP_STEPS, ...CUSTOMER_DEFERRED_SETUP_STEPS];
  return missingFields.every((field) =>
    deferred.includes(field as SignupStepName),
  );
}
