/**
 * Day 15 — Phase 2 Dispatch A. Local mirror of the wire shape from
 * `@welpco/types`'s `signup-state.type.ts`. We mirror rather than import
 * because `@welpco/ui` is a leaf package compiled with strict rootDir
 * boundaries — pulling in `@welpco/types` (which is published as raw .ts
 * sources for the app consumers) would drag the entire types package into
 * `@welpco/ui`'s tsc invocation.
 *
 * If the wire shape in `packages/types/src/domain/signup-state.type.ts`
 * changes, update this file in lockstep. The fields here are the strict
 * subset the step components actually read; the rest of the shape
 * (`completedSteps`, `requiredSteps`, etc.) is consumed by the wizard
 * router in `apps/web` directly from `@welpco/types`.
 */

export type SelectedRole = "customer" | "welper";

export type SignupStepName =
  | "selectRole"
  | "identity"
  | "welperBio"
  | "welperServiceArea"
  | "welperOffering"
  | "welperAvailability"
  | "welperPayout"
  | "notificationPrefs"
  | "optionalProfile";

export interface SignupStateLite {
  userId: string;
  email: string;
  signupCompleted: boolean;
  emailVerified: boolean;
  selectedRole: SelectedRole | null;
  completedSteps: SignupStepName[];
  nextStep: SignupStepName | null;
  requiredSteps: SignupStepName[];
  filledData: {
    identity?: {
      firstName: string;
      lastName: string;
      phone: string;
      dateOfBirth: string;
      tosAcceptedAt: string;
      privacyAcceptedAt: string;
    };
    [key: string]: unknown;
  };
}
