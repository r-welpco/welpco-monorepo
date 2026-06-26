import type { CustomerProfile } from "@/types";

export type BookingReadinessGap = "address" | "payment";

export function hasCustomerHomeAddress(profile?: CustomerProfile | null): boolean {
  return !!profile?.address?.streetAddress?.trim();
}

export function getCustomerBookingGaps(params: {
  profile?: CustomerProfile | null;
  paymentMethodCount: number;
}): BookingReadinessGap[] {
  const gaps: BookingReadinessGap[] = [];
  if (!hasCustomerHomeAddress(params.profile)) {
    gaps.push("address");
  }
  if (params.paymentMethodCount <= 0) {
    gaps.push("payment");
  }
  return gaps;
}

export function firstBookingReadinessGap(
  params: Parameters<typeof getCustomerBookingGaps>[0],
): BookingReadinessGap | undefined {
  return getCustomerBookingGaps(params)[0];
}
