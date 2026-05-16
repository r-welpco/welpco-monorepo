/** User may use the dashboard (signup done + launch access granted). */
export function hasPlatformAccess(user: {
  signupCompleted?: boolean;
  platformAccessEnabled?: boolean;
}): boolean {
  if (user.signupCompleted !== true) return false;
  return user.platformAccessEnabled !== false;
}

export function postSignupDestination(user: {
  signupCompleted?: boolean;
  platformAccessEnabled?: boolean;
}): "/register/complete" | "/dashboard" {
  return hasPlatformAccess(user) ? "/dashboard" : "/register/complete";
}
