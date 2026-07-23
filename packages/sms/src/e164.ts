export interface PhoneParts {
  countryCode: string;
  number: string;
  formatted?: string;
}

/**
 * Build an E.164 number from profile phone jsonb (`countryCode` + `number`).
 * Returns null when parts are missing or cannot form a valid E.164 string.
 */
export function toE164(phone: PhoneParts | null | undefined): string | null {
  if (!phone) return null;
  const country = String(phone.countryCode ?? "")
    .trim()
    .replace(/[^\d+]/g, "");
  const national = String(phone.number ?? "")
    .trim()
    .replace(/\D/g, "");
  if (!national) return null;

  let dial = country;
  if (!dial) return null;
  if (!dial.startsWith("+")) {
    dial = `+${dial.replace(/\D/g, "")}`;
  } else {
    dial = `+${dial.slice(1).replace(/\D/g, "")}`;
  }
  if (dial === "+") return null;

  const dialDigits = dial.slice(1);
  let local = national;
  if (local.startsWith(dialDigits)) {
    local = local.slice(dialDigits.length);
  }
  if (!local) return null;

  const e164 = `${dial}${local}`;
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) return null;
  return e164;
}
