import CompletePageClient from "./complete-page-client";

/**
 * Post-signup thank-you page shown during phased launch when dashboard
 * access is gated (`PLATFORM_ACCESS_GATED=true`).
 */
export default function RegisterCompletePage() {
  return <CompletePageClient />;
}
