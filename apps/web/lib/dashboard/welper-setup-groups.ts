import type { WelperSetupTaskDto, WelperSetupTaskId } from "@welpco/types";

/** Display order for section A (steps 1–5, + guardian when applicable). */
const SECTION_A_ORDER: WelperSetupTaskId[] = [
  "emailVerification",
  "optionalProfile",
  "welperServiceArea",
  "welperOffering",
  "welperAvailability",
  "welperGuardian",
];

const SECTION_B_ORDER: WelperSetupTaskId[] = ["welperPayout"];
const SECTION_C_ORDER: WelperSetupTaskId[] = ["welperBackgroundCheck"];

export type WelperSetupSectionId = "goLive" | "payout" | "trust";

export type WelperSetupTaskWithStep = WelperSetupTaskDto & { stepNumber: number };

export interface WelperSetupSectionView {
  id: WelperSetupSectionId;
  tasks: WelperSetupTaskWithStep[];
  completedCount: number;
  totalCount: number;
  complete: boolean;
}

export interface WelperSetupGroupedView {
  goLive: WelperSetupSectionView;
  payout: WelperSetupSectionView | null;
  trust: WelperSetupSectionView | null;
  /** Section A complete — profile visible, can receive jobs. */
  sectionAComplete: boolean;
  allComplete: boolean;
}

function pickTasksInOrder(
  setupTasks: WelperSetupTaskDto[],
  order: WelperSetupTaskId[],
  startStep: number,
): WelperSetupTaskWithStep[] {
  const byId = new Map(setupTasks.map((t) => [t.id, t]));
  let step = startStep;
  const result: WelperSetupTaskWithStep[] = [];
  for (const id of order) {
    const task = byId.get(id);
    if (!task) continue;
    result.push({ ...task, stepNumber: step });
    step += 1;
  }
  return result;
}

function buildSection(
  id: WelperSetupSectionId,
  tasks: WelperSetupTaskWithStep[],
): WelperSetupSectionView {
  const completedCount = tasks.filter((t) => t.completed).length;
  return {
    id,
    tasks,
    completedCount,
    totalCount: tasks.length,
    complete: tasks.length > 0 && tasks.every((t) => t.completed),
  };
}

export function buildWelperSetupGroupedView(
  setupTasks: WelperSetupTaskDto[],
): WelperSetupGroupedView {
  const goLiveTasks = pickTasksInOrder(setupTasks, SECTION_A_ORDER, 1);
  const goLive = buildSection("goLive", goLiveTasks);

  const payoutStart = goLiveTasks.length > 0 ? goLiveTasks[goLiveTasks.length - 1]!.stepNumber + 1 : 6;
  const payoutTasks = pickTasksInOrder(setupTasks, SECTION_B_ORDER, payoutStart);
  const payout = payoutTasks.length > 0 ? buildSection("payout", payoutTasks) : null;

  const trustStart = payoutTasks.length > 0 ? payoutTasks[payoutTasks.length - 1]!.stepNumber + 1 : payoutStart;
  const trustTasks = pickTasksInOrder(setupTasks, SECTION_C_ORDER, trustStart);
  const trust = trustTasks.length > 0 ? buildSection("trust", trustTasks) : null;

  return {
    goLive,
    payout,
    trust,
    sectionAComplete: goLive.complete,
    allComplete: setupTasks.every((t) => t.completed),
  };
}

/** First incomplete task in section A display order. */
export function firstPendingSectionATask(
  setupTasks: WelperSetupTaskDto[],
): WelperSetupTaskDto | undefined {
  const { goLive } = buildWelperSetupGroupedView(setupTasks);
  return goLive.tasks.find((t) => !t.completed);
}
