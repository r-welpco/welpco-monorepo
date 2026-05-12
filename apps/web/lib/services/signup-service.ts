import { apiClient } from "@/lib/api/client";
import type {
  BeginSignupResponseDto,
  SelectedRole,
  SignupStateDto,
} from "@welpco/types";

// ─── Step request types ─────────────────────────────────────────────────────
//
// Day 15 — Phase 2 Dispatch A. Typed wrappers for the unified signup wizard
// endpoints that ship under `/api/auth/signup/*`. Mirror the `dispute-service`
// shape (functional API, no class). DTOs reflect the BFF DTOs in
// `apps/bff/src/modules/auth/dto/*.ts` 1:1; the wire-shape lives in
// `@welpco/types` (`SignupStateDto`, `BeginSignupResponseDto`, etc.).
//
// All 11 endpoint wrappers live here even though Dispatch A only consumes
// three step submitters (selectRole, identity) plus begin/state/finish.
// Dispatches B/C wire up the remaining 7 step submitters; building them now
// keeps the surface area honest and avoids a service-layer churn later.

export interface BeginSignupParams {
  email: string;
  password: string;
}

export interface SelectRoleStepParams {
  role: SelectedRole;
}

export interface IdentityStepParams {
  firstName: string;
  lastName: string;
  /** International-format string. Validated server-side via libphonenumber-js. */
  phone: string;
  /** ISO 8601 date (YYYY-MM-DD); user must be at least 13. */
  dateOfBirth: string;
  /** ISO datetime captured at form submit time. */
  tosAcceptedAt: string;
  /** ISO datetime captured at form submit time. */
  privacyAcceptedAt: string;
}

export interface WelperBioStepParams {
  /** ≥ 120 characters per the Phase 1 contract. */
  bio: string;
}

export interface WelperServiceAreaStepParams {
  city: string;
  province: string;
  country: string;
  /** ≥ 1 postal-code prefix. */
  postalCodes: string[];
}

export interface WelperOfferingStepParams {
  categoryId: string;
  title: string;
  /** Hourly rate in the currency of the welper profile. */
  hourlyRate: number;
  description: string;
}

export interface WelperAvailabilityStepParams {
  /** Submit weekly slots OR set acceptsAdHocOnly: true (mutually exclusive). */
  weeklySlots?: Array<{
    /** ISO weekday name; the BFF normalizes case. */
    dayOfWeek: string;
    /** "HH:mm" 24h. */
    startTime: string;
    /** "HH:mm" 24h. */
    endTime: string;
  }>;
  acceptsAdHocOnly?: boolean;
}

export interface WelperPayoutStepParams {
  /** True once the welper finishes Stripe Connect onboarding. */
  stripeOnboardingCompleted?: boolean;
  /** Explicit skip; the welper acknowledges they cannot receive payouts yet. */
  skip?: boolean;
}

export interface NotificationPrefsStepParams {
  /** Empty list keeps the BFF defaults (BOOKING email + in-app on). */
  preferences: Array<{
    category: string;
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
  }>;
}

export interface OptionalProfileStepParams {
  photoUrl?: string;
  address?: {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  /** Explicit skip — server records step completion without photo or address. */
  skipped?: boolean;
}

// ─── API wrappers ───────────────────────────────────────────────────────────

/**
 * Step 1 of the wizard. Creates a `signup_completed: false` account, queues
 * the verification email, and returns access/refresh tokens plus the initial
 * signup state. The wizard then signs the user in via NextAuth and routes
 * them to `nextStep`.
 */
export async function beginSignup(
  params: BeginSignupParams,
): Promise<BeginSignupResponseDto> {
  return apiClient.post<BeginSignupResponseDto>(
    "/api/auth/signup/begin",
    params,
    { skipAuth: true },
  );
}

/** Read the server-owned wizard state for the authenticated user. */
export async function getSignupState(): Promise<SignupStateDto> {
  return apiClient.get<SignupStateDto>("/api/auth/signup/state");
}

/** Lock the user's role choice (customer or welper). One-way once set. */
export async function submitSelectRoleStep(
  params: SelectRoleStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/select-role",
    params,
  );
}

/** Submit identity fields (name, phone, DOB, ToS + privacy acceptance). */
export async function submitIdentityStep(
  params: IdentityStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/identity",
    params,
  );
}

/** Welper-only: bio (≥ 120 chars). */
export async function submitWelperBioStep(
  params: WelperBioStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/welper-bio",
    params,
  );
}

/** Welper-only: service area (city, province, country, postal codes). */
export async function submitWelperServiceAreaStep(
  params: WelperServiceAreaStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/welper-service-area",
    params,
  );
}

/** Welper-only: first service offering (category + rate + description). */
export async function submitWelperOfferingStep(
  params: WelperOfferingStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/welper-offering",
    params,
  );
}

/** Welper-only: weekly slots or explicit ad-hoc-only choice. */
export async function submitWelperAvailabilityStep(
  params: WelperAvailabilityStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/welper-availability",
    params,
  );
}

/** Optional legacy call — payout step removed from required wizard flow. */
export async function submitWelperPayoutStep(
  params: WelperPayoutStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/welper-payout",
    params,
  );
}

/** Both roles: notification preferences. Empty list keeps server defaults. */
export async function submitNotificationPrefsStep(
  params: NotificationPrefsStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/notification-prefs",
    params,
  );
}

/** Both roles: optional photo + address (skippable). */
export async function submitOptionalProfileStep(
  params: OptionalProfileStepParams,
): Promise<SignupStateDto> {
  return apiClient.post<SignupStateDto>(
    "/api/auth/signup/step/optional-profile",
    params,
  );
}

/**
 * Finalize the wizard. Returns 200 + `{ user, signupState }` when every
 * required field is on file; 422 with `code: 'INCOMPLETE_SIGNUP'` and a
 * structured `missingFields` list otherwise — the wizard surfaces that and
 * routes back to the indicated `nextStep`.
 *
 * The shape is `{ user, signupState }` (the orchestrator returns both so the
 * caller can refresh the session without a separate fetch). We unwrap to
 * `signupState` here so callers can keep treating `useFinishSignup` as a
 * `SignupStateDto`-returning mutation — the wider response is internal.
 */
export async function finishSignup(): Promise<SignupStateDto> {
  const response = await apiClient.post<{
    user: { id: string; email: string };
    signupState: SignupStateDto;
  }>("/api/auth/signup/finish");
  return response.signupState;
}
