export type ServiceTaxAddress = {
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

/** Minimal booking fields required for Stripe Tax calculations. */
export type BookingTaxContext = {
  id: string;
  customerId: string;
  hourlyRate: string | number | null;
  address: Record<string, string> | null;
};

/** Stripe Tax Calculation result for a booking service line (amounts in cents). */
export type BookingTaxQuote = {
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  /** Effective combined rate for display / legacy receipt column. */
  taxRateBps: number;
  stripeTaxCalculationId: string;
};
