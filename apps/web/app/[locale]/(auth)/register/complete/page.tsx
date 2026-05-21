import { redirect } from "next/navigation";

/** Legacy route — post-signup users go straight to the dashboard. */
export default function RegisterCompletePage() {
  redirect("/dashboard");
}
