import { create } from "zustand";
import type { RegistrationData, VerificationData, PasswordResetData, OnboardingData } from "@/types";

interface UserState {
  // Registration
  registrationData: Partial<RegistrationData> | null;
  setRegistrationData: (data: Partial<RegistrationData>) => void;
  clearRegistrationData: () => void;

  // Verification
  verificationEmail: string | null;
  setVerificationEmail: (email: string | null) => void;
  isVerified: boolean;
  setVerified: (verified: boolean) => void;

  // Password Reset
  passwordResetEmail: string | null;
  setPasswordResetEmail: (email: string | null) => void;
  passwordResetSent: boolean;
  setPasswordResetSent: (sent: boolean) => void;

  // Onboarding
  onboardingData: Partial<OnboardingData> | null;
  setOnboardingData: (data: Partial<OnboardingData>) => void;
  onboardingStep: string | null;
  setOnboardingStep: (step: string | null) => void;
  onboardingProgress: Record<string, unknown>;
  updateOnboardingProgress: (step: string, data: unknown) => void;
  clearOnboarding: () => void;

  // Loading states
  isLoading: boolean;
  setLoading: (loading: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Reset store
  reset: () => void;
}

const initialState = {
  registrationData: null,
  verificationEmail: null,
  isVerified: false,
  passwordResetEmail: null,
  passwordResetSent: false,
  onboardingData: null,
  onboardingStep: null,
  onboardingProgress: {},
  isLoading: false,
  error: null,
};

export const useUserStore = create<UserState>((set) => ({
  ...initialState,

  // Registration
  setRegistrationData: (data) => set({ registrationData: data }),
  clearRegistrationData: () => set({ registrationData: null }),

  // Verification
  setVerificationEmail: (email) => set({ verificationEmail: email }),
  setVerified: (verified) => set({ isVerified: verified }),

  // Password Reset
  setPasswordResetEmail: (email) => set({ passwordResetEmail: email }),
  setPasswordResetSent: (sent) => set({ passwordResetSent: sent }),

  // Onboarding
  setOnboardingData: (data) => set({ onboardingData: data }),
  setOnboardingStep: (step) => set({ onboardingStep: step }),
  updateOnboardingProgress: (step, data) =>
    set((state) => ({
      onboardingProgress: { ...state.onboardingProgress, [step]: data },
    })),
  clearOnboarding: () =>
    set({
      onboardingData: null,
      onboardingStep: null,
      onboardingProgress: {},
    }),

  // Loading and Error
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState),
}));

