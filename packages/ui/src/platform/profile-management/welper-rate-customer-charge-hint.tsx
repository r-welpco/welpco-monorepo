"use client";

import { Text } from "@welpco/ui/text";
import { FORM_SPACING } from "@welpco/ui/tokens";
import {
  customerHourlyChargeFromWelperRate,
  formatHourlyRateCurrency,
} from "../../pricing/welper-customer-rate";

export interface WelperRateCustomerChargeHintProps {
  welperRate: number | null | undefined;
  /** e.g. (charge) => `Customers will be charged ${charge}/hr for this service.` */
  formatMessage?: (formattedCustomerCharge: string) => string;
}

const defaultFormatMessage = (formattedCustomerCharge: string) =>
  `Customers will be charged ${formattedCustomerCharge}/hr for this service. This includes a platform service fee paid by the customer.`;

export function WelperRateCustomerChargeHint({
  welperRate,
  formatMessage = defaultFormatMessage,
}: WelperRateCustomerChargeHintProps) {
  const rate = typeof welperRate === "number" && Number.isFinite(welperRate) ? welperRate : 0;
  const customerCharge = customerHourlyChargeFromWelperRate(rate);
  if (customerCharge <= 0) return null;

  return (
    <Text size="1" color="gray" highContrast mt={FORM_SPACING.helperGap}>
      {formatMessage(formatHourlyRateCurrency(customerCharge))}
    </Text>
  );
}
