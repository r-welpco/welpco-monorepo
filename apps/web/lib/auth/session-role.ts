import type { SelectedRole } from "@welpco/types";

export function roleFromSelectedRole(
  selectedRole: SelectedRole | string | null | undefined,
): "welper" | "customer" | undefined {
  if (selectedRole === "welper") return "welper";
  if (selectedRole === "customer") return "customer";
  return undefined;
}
