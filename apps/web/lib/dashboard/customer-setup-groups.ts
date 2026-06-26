import type { CustomerSetupTaskDto, CustomerSetupTaskId } from "@welpco/types";

const SECTION_ACCOUNT_ORDER: CustomerSetupTaskId[] = [
  "emailVerification",
  "optionalProfile",
];

const SECTION_BOOKING_PAYMENT_ORDER: CustomerSetupTaskId[] = ["customerPayment"];

export type CustomerSetupSectionId = "account" | "bookingPayment";

export type CustomerSetupTaskWithStep = CustomerSetupTaskDto & { stepNumber: number };

export interface CustomerSetupSectionView {
  id: CustomerSetupSectionId;
  tasks: CustomerSetupTaskWithStep[];
  completedCount: number;
  totalCount: number;
  complete: boolean;
}

export interface CustomerSetupGroupedView {
  account: CustomerSetupSectionView;
  bookingPayment: CustomerSetupSectionView | null;
  /** Account section complete — email verified and home address on file. */
  sectionAComplete: boolean;
  allComplete: boolean;
}

function pickTasksInOrder(
  setupTasks: CustomerSetupTaskDto[],
  order: CustomerSetupTaskId[],
  startStep: number,
): CustomerSetupTaskWithStep[] {
  const byId = new Map(setupTasks.map((t) => [t.id, t]));
  let step = startStep;
  const result: CustomerSetupTaskWithStep[] = [];
  for (const id of order) {
    const task = byId.get(id);
    if (!task) continue;
    result.push({ ...task, stepNumber: step });
    step += 1;
  }
  return result;
}

function buildSection(
  id: CustomerSetupSectionId,
  tasks: CustomerSetupTaskWithStep[],
): CustomerSetupSectionView {
  const completedCount = tasks.filter((t) => t.completed).length;
  return {
    id,
    tasks,
    completedCount,
    totalCount: tasks.length,
    complete: tasks.length > 0 && tasks.every((t) => t.completed),
  };
}

export function buildCustomerSetupGroupedView(
  setupTasks: CustomerSetupTaskDto[],
): CustomerSetupGroupedView {
  const accountTasks = pickTasksInOrder(setupTasks, SECTION_ACCOUNT_ORDER, 1);
  const account = buildSection("account", accountTasks);

  const paymentStart =
    accountTasks.length > 0 ? accountTasks[accountTasks.length - 1]!.stepNumber + 1 : 3;
  const paymentTasks = pickTasksInOrder(
    setupTasks,
    SECTION_BOOKING_PAYMENT_ORDER,
    paymentStart,
  );
  const bookingPayment =
    paymentTasks.length > 0 ? buildSection("bookingPayment", paymentTasks) : null;

  return {
    account,
    bookingPayment,
    sectionAComplete: account.complete,
    allComplete: setupTasks.every((t) => t.completed),
  };
}

/** First incomplete task in account section display order. */
export function firstPendingSectionATask(
  setupTasks: CustomerSetupTaskDto[],
): CustomerSetupTaskDto | undefined {
  const { account } = buildCustomerSetupGroupedView(setupTasks);
  return account.tasks.find((t) => !t.completed);
}
