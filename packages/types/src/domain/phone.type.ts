/**
 * Phone number type definition
 * Used for structured phone number data
 */
export interface PhoneNumber {
  countryCode: string; // e.g., "+1"
  number: string; // e.g., "234567890"
  formatted?: string; // e.g., "+1 (234) 567-890"
}

