/** Verification page URL with email + optional return path (dashboard setup checklist). */
export function verificationHref(
  email: string,
  nextPath = "/dashboard",
): string {
  const params = new URLSearchParams();
  if (email.trim()) {
    params.set("email", email.trim());
  }
  if (nextPath) {
    params.set("next", nextPath);
  }
  const query = params.toString();
  return query ? `/verification?${query}` : "/verification";
}
