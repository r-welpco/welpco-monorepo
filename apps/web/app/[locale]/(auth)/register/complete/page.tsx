import CompletePageClient from "./complete-page-client";

/**
 * Post-signup thank-you page shown during phased launch when dashboard
 * access is gated (`platform_access_enabled: false`).
 */
export default function RegisterCompletePage() {
  return <CompletePageClient />;
}
