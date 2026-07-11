/**
 * Day 15 — Phase 1 of the signup ↔ onboarding merge.
 *
 * Wire-shape contract for the unified signup wizard. Shared between BFF and
 * web so the wizard renders against the same names / casings the BFF accepts.
 *
 * The role-conditional required-fields contract is owned by
 * `SignupOrchestratorService`; this file only describes the shape. Every step
 * is named identically on both sides — `selectRole`, `identity`, `welperBio`,
 * etc. — so the wizard URL `/register/step/[step]` and the BFF endpoint
 * `/auth/signup/step/[step]` map 1:1.
 */

/** Role chosen at step 1 of the wizard. NULL until the user picks. */
export type SelectedRole = 'customer' | 'welper';

/**
 * Canonical step names. The wizard router and the BFF orchestrator share
 * this enum. Any new step must be added here AND in
 * `SignupOrchestratorService` step-required logic.
 */
export type SignupStepName =
  | 'selectRole'
  | 'identity'
  | 'welperBio'
  | 'welperServiceArea'
  | 'welperOffering'
  | 'welperAvailability'
  | 'welperBackgroundCheck'
  | 'welperPayout'
  | 'optionalProfile'
  | 'customerPayment';

/** Post-signup dashboard checklist task ids (includes non-wizard items). */
export type WelperSetupTaskId =
  | 'emailVerification'
  | 'welperServiceArea'
  | 'welperOffering'
  | 'welperAvailability'
  | 'welperBackgroundCheck'
  | 'welperGuardian'
  | 'welperPayout'
  | 'optionalProfile';

/** Post-signup customer dashboard checklist task ids. */
export type CustomerSetupTaskId =
  | 'emailVerification'
  | 'optionalProfile'
  | 'customerPayment';

/**
 * Server-driven snapshot of a user's progress through the wizard. Returned
 * by `GET /auth/signup/state` on every step entry — the wizard does not
 * cache this; the server is the source of truth (Phase 1 acceptance
 * criterion).
 */
export interface SignupStateDto {
  /** UserAccount id; useful for the wizard's request-correlation logging. */
  userId: string;
  /** Email is already locked at signup-begin time. */
  email: string;
  /** True after `POST /auth/signup/finish` succeeds. */
  signupCompleted: boolean;
  /** Repurposed as a banner trigger; gates `bookableActions` in Phase 3. */
  emailVerified: boolean;
  /** Role chosen at step 1 of the wizard; null until the user picks. */
  selectedRole: SelectedRole | null;
  /**
   * Steps the orchestrator has accepted writes for, in submission order.
   * Re-submits to the same step are idempotent and do NOT duplicate this list.
   */
  completedSteps: SignupStepName[];
  /**
   * The next step the wizard should render. `null` means "all required
   * steps are complete; ready for /finish" (or the user already finished).
   * Computed server-side from the role-conditional required-fields contract.
   */
  nextStep: SignupStepName | null;
  /**
   * Required steps for the user's selected role, in the order the wizard
   * should render them. When `selectedRole` is null, contains only
   * `["selectRole"]` (the immediate next step).
   */
  requiredSteps: SignupStepName[];
  /**
   * Subset of step data already on file. Used by the wizard to pre-fill
   * forms when the user resumes mid-flow. Only includes fields the user
   * has explicitly provided — never inferred or auto-filled.
   */
  filledData: SignupFilledData;
  /** Post-signup setup tasks (dashboard checklist). Welper or customer shape. */
  setupTasks?: WelperSetupTaskDto[] | CustomerSetupTaskDto[];
  /** All required setup tasks complete. */
  setupComplete?: boolean;
  /** All setup tasks complete, including optional background check and payout. */
  allSetupComplete?: boolean;
  /** Welper-only: visible in customer search (required profile setup complete). */
  discoverable?: boolean;
}

/** Post-signup welper task shown on the dashboard setup checklist. */
export interface WelperSetupTaskDto {
  id: WelperSetupTaskId;
  label: string;
  completed: boolean;
  required: boolean;
  /** Deep-link path segment or route hint for the web app. */
  href: string;
  blockingReason?: string;
}

/** Post-signup customer task shown on the dashboard setup checklist. */
export interface CustomerSetupTaskDto {
  id: CustomerSetupTaskId;
  label: string;
  completed: boolean;
  required: boolean;
  href: string;
  blockingReason?: string;
}

/**
 * Shape of pre-fill data returned to the wizard. Each top-level key
 * corresponds to a step name; absence means "no submission yet".
 */
export interface SignupFilledData {
  identity?: {
    firstName: string;
    lastName: string;
    phone: string;
    dateOfBirth: string;
    tosAcceptedAt: string;
    privacyAcceptedAt: string;
  };
  welperBio?: { bio: string };
  welperServiceArea?: {
    city: string;
    province: string;
    country: string;
    postalCodes: string[];
    radiusKm?: number;
    serviceArea?: {
      type: "radius";
      centerAddress: {
        streetAddress?: string;
        city: string;
        stateProvince: string;
        zipPostalCode?: string;
        country?: string;
      };
      radiusKm: number;
      /** @deprecated Legacy payloads */
      radiusMiles?: number;
    };
  };
  welperOffering?: {
    offerings: Array<{
      subcategoryId: string;
      title: string;
      hourlyRate: number;
      description: string;
    }>;
  };
  welperAvailability?: {
    weeklySlots?: Array<{
      dayOfWeek: string;
      startTime: string;
      endTime: string;
    }>;
    acceptsAdHocOnly?: boolean;
  };
  welperBackgroundCheck?: {
    paid: boolean;
    certnStatus: string;
    applicantUrl?: string;
    listPriceCents: number;
    promoPriceCents: number;
    promoEnabled: boolean;
    skipped?: boolean;
  };
  welperGuardian?: {
    status: string | null;
    guardianFullName: string | null;
    guardianEmail: string | null;
    signupStepComplete: boolean;
  };
  welperPayout?: {
    stripeOnboardingCompleted?: boolean;
  };
  notificationPrefs?: {
    preferences: Array<{
      category: string;
      emailEnabled?: boolean;
      inAppEnabled?: boolean;
    }>;
  };
  optionalProfile?: {
    photoUrl?: string;
    address?: {
      streetAddress?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
  };
}

/**
 * Response shape of `POST /auth/signup/begin`. Mirrors the existing
 * `AuthResponseDto` so the wizard can use the access token immediately for
 * subsequent step calls without a second login.
 */
export interface BeginSignupResponseDto {
  accessToken: string;
  refreshToken: string;
  signupState: SignupStateDto;
}

/**
 * Error body for `POST /auth/signup/finish` when role-required fields are
 * missing. Mirrors the bible §22.6 contract: tell the user exactly what's
 * missing so the wizard can route them to the right step.
 */
export interface IncompleteSignupErrorBody {
  code: 'INCOMPLETE_SIGNUP';
  message: string;
  missingFields: string[];
  /** The step the wizard should send the user back to, when applicable. */
  nextStep: SignupStepName | null;
}

/**
 * Error body for any bookable-action endpoint guarded by `EmailVerifiedGuard`
 * when the user has not yet verified their email. Surfaced in Phase 3 as a
 * focused dialog on the web side.
 */
export interface EmailVerificationRequiredErrorBody {
  code: 'EMAIL_VERIFICATION_REQUIRED';
  message: string;
}

/**
 * Error body for `POST /auth/signup/begin` when the email already has a
 * completed account. The wizard should redirect to /login rather than
 * keeping the user in the signup flow.
 */
export interface AccountExistsErrorBody {
  code: 'ACCOUNT_EXISTS';
  message: string;
}
