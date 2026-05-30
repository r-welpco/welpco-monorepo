/** Canadian provinces and territories (ISO 3166-2 codes). */
export const CANADIAN_PROVINCES = [
  { code: 'AB', label: 'Alberta' },
  { code: 'BC', label: 'British Columbia' },
  { code: 'MB', label: 'Manitoba' },
  { code: 'NB', label: 'New Brunswick' },
  { code: 'NL', label: 'Newfoundland and Labrador' },
  { code: 'NS', label: 'Nova Scotia' },
  { code: 'NT', label: 'Northwest Territories' },
  { code: 'NU', label: 'Nunavut' },
  { code: 'ON', label: 'Ontario' },
  { code: 'PE', label: 'Prince Edward Island' },
  { code: 'QC', label: 'Quebec' },
  { code: 'SK', label: 'Saskatchewan' },
  { code: 'YT', label: 'Yukon' },
] as const;

export type CanadianProvinceCode = (typeof CANADIAN_PROVINCES)[number]['code'];

export const CANADIAN_PROVINCE_CODES = new Set<string>(
  CANADIAN_PROVINCES.map((p) => p.code),
);

const PROVINCE_NAME_TO_CODE = new Map<string, CanadianProvinceCode>(
  CANADIAN_PROVINCES.flatMap((p) => [
    [p.label.toUpperCase(), p.code],
    [p.code, p.code],
  ]),
);

export function normalizeCanadianProvinceCode(raw: string | null | undefined): string {
  if (!raw?.trim()) return '';
  const upper = raw.trim().toUpperCase();
  if (CANADIAN_PROVINCE_CODES.has(upper)) return upper;
  return PROVINCE_NAME_TO_CODE.get(upper) ?? '';
}

export const CANADA_COUNTRY_CODE = 'CA';

/** Canadian postal code: A1A 1A1 (space optional). */
export const CANADIAN_POSTAL_CODE_PATTERN = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
