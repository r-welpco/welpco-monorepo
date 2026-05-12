import { apiClient } from "@/lib/api/client";

export interface SavedPaymentMethod {
  id: string;
  brand?: string;
  last4?: string;
  expMonth?: number | null;
  expYear?: number | null;
  isDefault: boolean;
}

export async function createSetupIntent(): Promise<{ clientSecret: string | null }> {
  return apiClient.post<{ clientSecret: string | null }>("/api/payments/setup-intent");
}

/** Persist default PM after Stripe.js confirmSetup (needed when webhooks do not run). */
export async function completeSetupIntent(setupIntentId: string): Promise<void> {
  await apiClient.post("/api/payments/setup-intent/complete", { setupIntentId });
}

export async function listPaymentMethods(): Promise<SavedPaymentMethod[]> {
  return apiClient.get<SavedPaymentMethod[]>("/api/payments/payment-methods");
}

export async function setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
  await apiClient.post(`/api/payments/payment-methods/${encodeURIComponent(paymentMethodId)}/default`);
}

export async function detachPaymentMethod(paymentMethodId: string): Promise<void> {
  await apiClient.delete(`/api/payments/payment-methods/${encodeURIComponent(paymentMethodId)}`);
}

export interface BookingPaymentIntentResponse {
  clientSecret: string | null;
  paymentIntentId: string;
  requiresAction?: boolean;
  status: string;
}

export async function createBookingPaymentIntent(bookingId: string): Promise<BookingPaymentIntentResponse> {
  return apiClient.post<BookingPaymentIntentResponse>(`/api/bookings/${encodeURIComponent(bookingId)}/payment-intent`);
}
