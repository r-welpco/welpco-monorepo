import type { WelperSetupTaskDto } from "@welpco/types";
import type { WelperSetupChecklistDto } from "@/lib/services/welper-setup-service";

const EMAIL_VERIFICATION_TASK: WelperSetupTaskDto = {
  id: "emailVerification",
  label: "Verify your email",
  href: "/verification",
  required: true,
  completed: false,
};

/** Ensures email verification is always the first checklist step (handles stale BFF). */
export function normalizeWelperSetupChecklist(
  data: WelperSetupChecklistDto,
  emailVerified: boolean,
): WelperSetupChecklistDto {
  const emailTask: WelperSetupTaskDto = {
    ...EMAIL_VERIFICATION_TASK,
    completed: emailVerified,
  };
  const rest = data.setupTasks
    .filter((t) => t.id !== "emailVerification")
    .map((t) =>
      t.id === "optionalProfile"
        ? { ...t, required: true, label: t.label || "Profile photo" }
        : t,
    );
  const setupTasks = [emailTask, ...rest];
  const setupComplete = setupTasks
    .filter((t) => t.required)
    .every((t) => t.completed);
  const allSetupComplete =
    data.allSetupComplete ?? setupTasks.every((t) => t.completed);
  return { ...data, setupTasks, setupComplete, allSetupComplete };
}
