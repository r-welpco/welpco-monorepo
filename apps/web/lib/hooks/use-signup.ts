import type { QueryClient } from "@tanstack/react-query";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { signIn, useSession } from "next-auth/react";
import { clearTokenCache } from "@/lib/api/get-token";
import { hasApiSession } from "@/lib/auth/has-api-session";
import { getWelperSetupChecklist } from "@/lib/services/welper-setup-service";
import { getCustomerSetupChecklist } from "@/lib/services/customer-setup-service";
import {
  beginSignup,
  finishSignup,
  getSignupState,
  submitIdentityStep,
  submitNotificationPrefsStep,
  submitOptionalProfileStep,
  submitSelectRoleStep,
  submitWelperAvailabilityStep,
  submitWelperBackgroundCheckStep,
  submitWelperBioStep,
  submitWelperOfferingStep,
  submitWelperServiceAreaStep,
  submitWelperPayoutStep,
  type BeginSignupParams,
  type WelperPayoutStepParams,
  type IdentityStepParams,
  type NotificationPrefsStepParams,
  type OptionalProfileStepParams,
  type SelectRoleStepParams,
  type WelperAvailabilityStepParams,
  type WelperBioStepParams,
  type WelperOfferingStepParams,
  type WelperServiceAreaStepParams,
  type SelectRoleStepResponseDto,
} from "@/lib/services/signup-service";
import {
  confirmBackgroundCheckReturn,
  createBackgroundCheckCheckoutSession,
  getBackgroundCheckStatus,
  resendBackgroundCheckInviteEmail,
} from "@/lib/services/background-check-service";
import {
  createStripeConnectAccountLink,
  getStripeConnectStatus,
  syncStripeConnectAccount,
} from "@/lib/services/stripe-connect-service";
import type { BeginSignupResponseDto, SignupStateDto } from "@welpco/types";

/**
 * Day 15 — Phase 2 Dispatch A. Single React Query store of truth for the
 * signup wizard. Mirrors the `use-disputes` pattern: one query for state,
 * one mutation per write, all writes invalidate the state query so the
 * server-owned `nextStep` is always fresh.
 *
 * The mutations for steps not yet rendered in Dispatch A (welperBio,
 * welperServiceArea, welperOffering, welperAvailability,
 * notificationPrefs, optionalProfile) are exported now so Dispatch B can
 * wire its components without touching this file.
 */

const SIGNUP_STATE_KEY = ["signup", "state"] as const;

function useHasApiSession(): boolean {
  const { data: session, status } = useSession();
  return hasApiSession(status, session);
}

// ─── State query ────────────────────────────────────────────────────────────

/**
 * Read the server-owned wizard state. Refetches on focus + on every successful
 * step write (via mutation `onSuccess` invalidations). The wizard does not
 * cache this value — `nextStep` must always reflect the BFF's source of truth.
 */
export function useSignupState() {
  const canCallApi = useHasApiSession();
  return useQuery<SignupStateDto>({
    queryKey: SIGNUP_STATE_KEY,
    queryFn: getSignupState,
    enabled: canCallApi,
    staleTime: 30_000,
    // Keep wizard state visible while refetching — refetch on tab focus must not
    // unmount step forms and wipe in-progress fields.
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

// ─── Begin signup ───────────────────────────────────────────────────────────

/**
 * Step 1 of the wizard. After the BFF creates the account it returns access +
 * refresh tokens; the hook calls NextAuth's credentials provider with
 * `redirect: false` so subsequent step calls run with a populated session.
 *
 * The credentials provider re-authenticates the user with the same email/
 * password — using the BFF tokens directly would require a credentials-shape
 * change Phase 3 will land. For Dispatch A we trade one extra round-trip for
 * staying inside the existing NextAuth contract.
 */
export function useBeginSignup() {
  const queryClient = useQueryClient();
  return useMutation<BeginSignupResponseDto, Error, BeginSignupParams>({
    mutationFn: async (params) => {
      const response = await beginSignup(params);
      clearTokenCache();

      const signInResult = await signIn("credentials", {
        email: params.email,
        signupBootstrap: "true",
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }

      clearTokenCache();

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SIGNUP_STATE_KEY });
    },
  });
}

// ─── Step mutations ─────────────────────────────────────────────────────────

function useStepMutation<TParams>(
  fn: (params: TParams) => Promise<SignupStateDto>,
) {
  const queryClient = useQueryClient();
  return useMutation<SignupStateDto, Error, TParams>({
    mutationFn: fn,
    onSuccess: (state) => {
      // The BFF returns the fresh state — seed the cache so the wizard reads
      // it on the next render without an extra round-trip, then invalidate to
      // keep refetches honest if other tabs mutate.
      queryClient.setQueryData<SignupStateDto>(SIGNUP_STATE_KEY, state);
      queryClient.invalidateQueries({ queryKey: SIGNUP_STATE_KEY });
      queryClient.invalidateQueries({ queryKey: SETUP_CHECKLIST_KEY_PREFIX });
    },
  });
}

export function useCompleteSelectRoleStep() {
  const queryClient = useQueryClient();
  const { update: updateSession } = useSession();
  return useMutation<SelectRoleStepResponseDto, Error, SelectRoleStepParams>({
    mutationFn: submitSelectRoleStep,
    onSuccess: async (state) => {
      const sessionPatch: {
        accessToken?: string;
        refreshToken?: string;
      } = {};
      if (typeof state.accessToken === "string") {
        sessionPatch.accessToken = state.accessToken;
      }
      if (typeof state.refreshToken === "string") {
        sessionPatch.refreshToken = state.refreshToken;
      }
      await updateSession(sessionPatch);
      clearTokenCache();
      queryClient.setQueryData<SignupStateDto>(SIGNUP_STATE_KEY, state);
      queryClient.invalidateQueries({ queryKey: SIGNUP_STATE_KEY });
      queryClient.invalidateQueries({ queryKey: SETUP_CHECKLIST_KEY_PREFIX });
    },
  });
}

export function useCompleteIdentityStep() {
  return useStepMutation<IdentityStepParams>(submitIdentityStep);
}

export function useCompleteWelperBioStep() {
  return useStepMutation<WelperBioStepParams>(submitWelperBioStep);
}

export function useCompleteWelperServiceAreaStep() {
  return useStepMutation<WelperServiceAreaStepParams>(
    submitWelperServiceAreaStep,
  );
}

export function useCompleteWelperOfferingStep() {
  return useStepMutation<WelperOfferingStepParams>(submitWelperOfferingStep);
}

export function useCompleteWelperAvailabilityStep() {
  return useStepMutation<WelperAvailabilityStepParams>(
    submitWelperAvailabilityStep,
  );
}

export function useCompleteWelperBackgroundCheckStep() {
  return useStepMutation<void>(submitWelperBackgroundCheckStep);
}

const BACKGROUND_CHECK_STATUS_KEY = ["verification", "background-check", "status"] as const;

export const SETUP_CHECKLIST_KEY_PREFIX = ["profiles", "me", "setup-checklist"] as const;

/** Role-scoped cache key (customer vs welper use different BFF payloads). */
export function setupChecklistQueryKey(role: "customer" | "welper") {
  return [...SETUP_CHECKLIST_KEY_PREFIX, role] as const;
}

/** Invalidate every setup-checklist query (customer + welper). */
export function invalidateSetupChecklists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: SETUP_CHECKLIST_KEY_PREFIX });
}

/** @deprecated Prefer {@link invalidateSetupChecklists} — prefix matches all roles. */
export const WELPER_SETUP_CHECKLIST_KEY = SETUP_CHECKLIST_KEY_PREFIX;

export function useBackgroundCheckStatus(enabled = true) {
  const canCallApi = useHasApiSession();
  return useQuery({
    queryKey: BACKGROUND_CHECK_STATUS_KEY,
    queryFn: getBackgroundCheckStatus,
    enabled: canCallApi && enabled,
    staleTime: 10_000,
    retry: 1,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.paymentStatus === "paid" && !data.certnInviteReady) {
        return 3000;
      }
      return false;
    },
  });
}

export function useCreateBackgroundCheckCheckout() {
  return useMutation({
    mutationFn: (locale: "en" | "fr") => createBackgroundCheckCheckoutSession(locale),
  });
}

export function useConfirmBackgroundCheckReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => confirmBackgroundCheckReturn(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BACKGROUND_CHECK_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: SIGNUP_STATE_KEY });
      queryClient.invalidateQueries({ queryKey: SETUP_CHECKLIST_KEY_PREFIX });
    },
  });
}

export function useResendBackgroundCheckInviteEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendBackgroundCheckInviteEmail,
    onSuccess: (data) => {
      queryClient.setQueryData(BACKGROUND_CHECK_STATUS_KEY, data);
    },
  });
}

const STRIPE_CONNECT_STATUS_KEY = ["payment", "connect", "status"] as const;

export function useStripeConnectStatus(enabled = true) {
  const canCallApi = useHasApiSession();
  return useQuery({
    queryKey: STRIPE_CONNECT_STATUS_KEY,
    queryFn: getStripeConnectStatus,
    enabled: canCallApi && enabled,
    staleTime: 10_000,
  });
}

export function useCreateStripeConnectLink() {
  return useMutation({
    mutationFn: (locale: "en" | "fr") => createStripeConnectAccountLink(locale),
  });
}

export function useSyncStripeConnect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: syncStripeConnectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STRIPE_CONNECT_STATUS_KEY });
      queryClient.invalidateQueries({ queryKey: SIGNUP_STATE_KEY });
      queryClient.invalidateQueries({ queryKey: SETUP_CHECKLIST_KEY_PREFIX });
    },
  });
}

export function useCompleteWelperPayoutStep() {
  return useStepMutation<WelperPayoutStepParams>(submitWelperPayoutStep);
}

export function useCompleteNotificationPrefsStep() {
  return useStepMutation<NotificationPrefsStepParams>(
    submitNotificationPrefsStep,
  );
}

export function useCompleteOptionalProfileStep() {
  return useStepMutation<OptionalProfileStepParams>(submitOptionalProfileStep);
}

// ─── Finish ─────────────────────────────────────────────────────────────────

/**
 * Finalize the wizard. On success, invalidates both the signup state cache
 * (so any lingering wizard read sees `signupCompleted: true`) and the
 * NextAuth session cache (so `proxy.ts` middleware sees the new flag). The
 * caller is responsible for navigating to the post-signup destination.
 */
export function useWelperSetupChecklist(enabled = true) {
  const canCallApi = useHasApiSession();
  return useQuery({
    queryKey: setupChecklistQueryKey("welper"),
    queryFn: getWelperSetupChecklist,
    enabled: canCallApi && enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return false;
      const allDone =
        data.allSetupComplete ??
        (data.setupComplete &&
          !data.setupTasks.some((task) => !task.required && !task.completed));
      if (allDone) return false;
      return 30_000;
    },
  });
}

export function useCustomerSetupChecklist(enabled = true) {
  const canCallApi = useHasApiSession();
  return useQuery({
    queryKey: setupChecklistQueryKey("customer"),
    queryFn: getCustomerSetupChecklist,
    enabled: canCallApi && enabled,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data || data.setupComplete) return false;
      return 30_000;
    },
  });
}

export function useInvalidateWelperSetupChecklist() {
  const queryClient = useQueryClient();
  return () => invalidateSetupChecklists(queryClient);
}

export function useFinishSignup() {
  const queryClient = useQueryClient();
  return useMutation<SignupStateDto, Error, void>({
    mutationFn: () => finishSignup(),
    onSuccess: (state) => {
      queryClient.setQueryData<SignupStateDto>(SIGNUP_STATE_KEY, state);
      queryClient.invalidateQueries({ queryKey: SIGNUP_STATE_KEY });
      queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
    },
  });
}
