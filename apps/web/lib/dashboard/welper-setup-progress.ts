import type { WelperSetupTaskDto } from "@welpco/types";

export interface WelperSetupProgress {
  requiredTasks: WelperSetupTaskDto[];
  requiredComplete: boolean;
  allComplete: boolean;
  pendingOptionalTasks: WelperSetupTaskDto[];
  /** Tasks to show in the header action list after required work is done. */
  pendingActionTasks: WelperSetupTaskDto[];
}

export function getWelperSetupProgress(
  setupTasks: WelperSetupTaskDto[],
): WelperSetupProgress {
  const requiredTasks = setupTasks.filter((task) => task.required);
  const requiredComplete = requiredTasks.every((task) => task.completed);
  const allComplete = setupTasks.every((task) => task.completed);
  const pendingOptionalTasks = setupTasks.filter(
    (task) => !task.required && !task.completed,
  );
  const pendingRequiredTasks = requiredTasks.filter((task) => !task.completed);
  const pendingActionTasks = requiredComplete
    ? pendingOptionalTasks
    : pendingRequiredTasks;

  return {
    requiredTasks,
    requiredComplete,
    allComplete,
    pendingOptionalTasks,
    pendingActionTasks,
  };
}
