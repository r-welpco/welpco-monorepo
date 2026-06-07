/** Welpers 18+ require a paid background check; 14–17 are exempt. */
export function calculateAgeUtc(dateOfBirth: Date | string): number | null {
  const dob = typeof dateOfBirth === 'string' ? new Date(dateOfBirth) : dateOfBirth;
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - dob.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export function isAdultWelper(dateOfBirth: Date | string | null | undefined): boolean {
  if (!dateOfBirth) return false;
  const age = calculateAgeUtc(dateOfBirth);
  return age !== null && age >= 18;
}

/** True when DOB is present and the welper is under 18 (matches guardian-consent logic). */
export function isMinorWelper(dateOfBirth: Date | string | null | undefined): boolean {
  if (!dateOfBirth) return false;
  return !isAdultWelper(dateOfBirth);
}
