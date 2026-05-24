import type { CustomerSetupTaskDto } from "@welpco/types";
import type { CustomerSetupChecklistDto } from "@/lib/services/customer-setup-service";

const EMAIL_VERIFICATION_TASK: CustomerSetupTaskDto = {
  id: "emailVerification",
  label: "Verify your email",
  href: "/verification",
  required: true,
  completed: false,
};

/** Ensures email verification is always the first checklist step (handles stale BFF). */
export function normalizeCustomerSetupChecklist(
  data: CustomerSetupChecklistDto,
  emailVerified: boolean,
): CustomerSetupChecklistDto {
  const emailTask: CustomerSetupTaskDto = {
    ...EMAIL_VERIFICATION_TASK,
    completed: emailVerified,
  };
  const rest = data.setupTasks
    .filter((t) => t.id !== "emailVerification")
    .map((t) =>
      t.id === "optionalProfile"
        ? { ...t, required: true, label: t.label || "Home address" }
        : t,
    );
  const setupTasks = [emailTask, ...rest];
  const setupComplete = setupTasks
    .filter((t) => t.required)
    .every((t) => t.completed);
  return { ...data, setupTasks, setupComplete };
}
