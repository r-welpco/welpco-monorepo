import { apiClient } from "@/lib/api/client";

export async function getPaymentCaptureDelay(): Promise<{ key: string; value: number }> {
  return apiClient.get<{ key: string; value: number }>(
    "/api/admin/settings/payment_capture_delay_minutes"
  );
}

export async function setPaymentCaptureDelay(value: string): Promise<{
  ok: boolean;
  key: string;
  value: string;
}> {
  return apiClient.put<{ ok: boolean; key: string; value: string }>(
    "/api/admin/settings/payment_capture_delay_minutes",
    { value }
  );
}
