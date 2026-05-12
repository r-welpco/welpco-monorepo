/**
 * Phone number type used for structured phone data.
 */
export interface PhoneNumber {
  countryCode: string;
  number: string;
  formatted?: string;
}
