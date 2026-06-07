import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveGuardianConsent,
  getGuardianConsentStatus,
  getGuardianReviewPreview,
  resendGuardianReviewEmail,
  submitGuardianRequest,
  type SubmitGuardianRequestPayload,
} from "@/lib/services/guardian-consent-service";

export function useGuardianConsentStatus(enabled = true) {
  return useQuery({
    queryKey: ["guardian-consent", "status"],
    queryFn: getGuardianConsentStatus,
    enabled,
  });
}

export function useSubmitGuardianRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SubmitGuardianRequestPayload) => submitGuardianRequest(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["guardian-consent"] });
      void queryClient.invalidateQueries({ queryKey: ["welper-setup-checklist"] });
    },
  });
}

export function useResendGuardianReviewEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: resendGuardianReviewEmail,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["guardian-consent"] });
    },
  });
}

export function useGuardianReviewPreview(token: string | null) {
  return useQuery({
    queryKey: ["guardian-consent", "review", token],
    queryFn: () => getGuardianReviewPreview(token!),
    enabled: !!token,
    retry: false,
  });
}

export function useApproveGuardianConsent() {
  return useMutation({
    mutationFn: (token: string) => approveGuardianConsent(token),
  });
}
