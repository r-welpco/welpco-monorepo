import { apiClient } from "@/lib/api/client";
import type {
  RegistrationData,
  VerificationData,
  PasswordResetData,
  OnboardingData,
  User,
} from "@/types";

// Backend API response types (profile from profile domain, under .profile)
interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    accountType: string;
    status: string;
    emailVerified: boolean;
  };
  profile?: { onboardingCompleted: boolean };
}

// Helper to map backend account type to frontend role
function mapAccountTypeToRole(accountType: string): "customer" | "welper" {
  return accountType.toLowerCase() === "welper" ? "welper" : "customer";
}

// Helper to map frontend role to backend account type
// Backend expects "Customer" or "Welper" (capitalized, not uppercase enum keys)
function mapRoleToAccountType(role: "customer" | "welper"): "Customer" | "Welper" {
  return role.charAt(0).toUpperCase() + role.slice(1) as "Customer" | "Welper";
}

// Helper to convert backend user to frontend User type
function mapBackendUserToFrontend(backendUser: AuthResponse["user"]): User {
  return {
    id: backendUser.id,
    email: backendUser.email,
    name: backendUser.email.split("@")[0], // Backend doesn't return name, use email prefix
    role: mapAccountTypeToRole(backendUser.accountType),
    image: null,
    emailVerified: backendUser.emailVerified ?? false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Registration
export async function registerUser(
  data: RegistrationData,
  role: "customer" | "welper"
): Promise<{ user: User; requiresVerification: boolean }> {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/register",
      {
        email: data.email,
        password: data.password,
        accountType: mapRoleToAccountType(role),
        referralCode: data.referralCode,
      },
      { skipAuth: true }
    );

    return {
      user: mapBackendUserToFrontend(response.user),
      requiresVerification: !response.user.emailVerified,
    };
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number; message?: string };
    if (apiError.statusCode === 409) {
      throw new Error("An account with this email already exists");
    }
    throw new Error(apiError.message || "Registration failed");
  }
}

// Backwards compatibility wrappers
export const registerCustomer = (data: RegistrationData) => registerUser(data, "customer");
export const registerWelper = (data: RegistrationData) => registerUser(data, "welper");

// Login - Direct API call to backend.
// Day 15 Dispatch C: post-signup-merge, the BFF's login response carries
// `signupCompleted` directly on `response.user`. We keep
// `response.profile?.onboardingCompleted` as a defensive read for any
// short-lived in-flight cookie/session that pre-dates the merge.
export async function login(
  email: string,
  password: string
): Promise<{ user: User; signupCompleted: boolean }> {
  try {
    const response = await apiClient.post<AuthResponse>(
      "/api/auth/login",
      {
        email,
        password,
      },
      { skipAuth: true }
    );

    const user = mapBackendUserToFrontend(response.user);
    const responseUser = response.user as {
      signupCompleted?: boolean;
      onboardingCompleted?: boolean;
    };
    const signupCompleted =
      responseUser.signupCompleted ??
      response.profile?.onboardingCompleted ??
      responseUser.onboardingCompleted ??
      false;

    return {
      user,
      signupCompleted,
    };
  } catch (error: any) {
    if (error.statusCode === 401) {
      throw new Error("Invalid email or password");
    }
    throw new Error(error.message || "Login failed");
  }
}

// Verification
export async function verifyAccount(data: VerificationData): Promise<{ success: boolean }> {
  try {
    await apiClient.post(
      "/api/auth/verify-email",
      {
        email: data.email,
        token: data.code,
      },
      { skipAuth: true }
    );
    return { success: true };
  } catch (error: unknown) {
    const apiError = error as { statusCode?: number; message?: string };
    if (apiError.statusCode === 400) {
      throw new Error("Invalid or expired verification token");
    }
    throw new Error(apiError.message || "Verification failed");
  }
}

export async function resendVerificationCode(email: string): Promise<void> {
  try {
    // Backend requires authentication for resend verification
    await apiClient.post("/api/auth/resend-verification-email");
  } catch (error: any) {
    if (error.statusCode === 400) {
      throw new Error("Email is already verified");
    }
    if (error.statusCode === 404) {
      throw new Error("User not found");
    }
    throw new Error(error.message || "Failed to resend verification email");
  }
}

/** Persist UI/email language for the signed-in user. */
export async function updatePreferredLocale(
  preferredLocale: "en" | "fr",
): Promise<void> {
  await apiClient.patch("/api/auth/preferred-locale", { preferredLocale });
}

// Password Reset
export async function requestPasswordReset(data: PasswordResetData): Promise<void> {
  try {
    await apiClient.post(
      "/api/auth/reset-password",
      {
        email: data.email,
        ...(data.preferredLocale ? { preferredLocale: data.preferredLocale } : {}),
      },
      { skipAuth: true }
    );
    // Backend returns 200 even if user doesn't exist (security best practice)
  } catch (error: any) {
    if (error.statusCode === 429) {
      throw new Error("Too many requests. Please try again later.");
    }
    throw new Error(error.message || "Failed to request password reset");
  }
}

export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<void> {
  try {
    await apiClient.post(
      "/api/auth/reset-password/confirm",
      {
        email,
        token,
        newPassword,
      },
      { skipAuth: true }
    );
  } catch (error: any) {
    if (error.statusCode === 400) {
      throw new Error("Invalid or expired reset token");
    }
    throw new Error(error.message || "Failed to reset password");
  }
}

// Day 15 Dispatch C — the standalone onboarding flow is gone. The
// signup wizard (`/register`) writes per-step on the BFF and the
// orchestrator flips `signupCompleted` on `/auth/signup/finish`. The
// helper below is retained as a no-op shim for any caller still on the
// legacy code path; new code should rely on the wizard's `useFinishSignup`
// hook instead.
export async function completeOnboarding(_data?: OnboardingData): Promise<void> {
  return;
}

// Check email verification status from backend. Read paths still expose
// `onboardingCompleted` because the BFF column is retained in lockstep with
// `signupCompleted` until a future migration drops it.
export async function checkEmailVerificationStatus(email: string): Promise<{ emailVerified: boolean; signupCompleted?: boolean }> {
  try {
    const response = await apiClient.get<UserAccount>("/api/users/me");
    if (response.email.toLowerCase() !== email.toLowerCase()) {
      return { emailVerified: false };
    }
    return {
      emailVerified: response.emailVerified ?? false,
      signupCompleted: response.signupCompleted ?? response.onboardingCompleted ?? false,
    };
  } catch {
    return { emailVerified: false };
  }
}

// Settings: Change password
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post("/api/auth/change-password", { currentPassword, newPassword });
}

// Settings: Update email
export async function updateEmail(email: string): Promise<void> {
  await apiClient.put("/api/users/me", { email });
}

// Settings: Delete (deactivate) account
export async function deleteAccount(): Promise<void> {
  await apiClient.delete("/api/users/me");
}

// Type for user account from backend
interface UserAccount {
  id: string;
  email: string;
  accountType: string;
  status: string;
  emailVerified: boolean;
  /** Post-merge source of truth (Day 15). */
  signupCompleted?: boolean;
  /** Legacy alias retained until a future BFF migration drops the column. */
  onboardingCompleted?: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
}
