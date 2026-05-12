import { DayOfWeek } from '../../domains/profile-management/entities/day-of-week.enum';
import { RecurringPattern } from '../../domains/profile-management/entities/recurring-pattern.enum';

/** Frontend dayOfWeek: 0=Sunday, 1=Monday, ... 6=Saturday */
export const DAY_NUM_TO_BACKEND: Record<number, DayOfWeek> = {
  0: DayOfWeek.SUNDAY,
  1: DayOfWeek.MONDAY,
  2: DayOfWeek.TUESDAY,
  3: DayOfWeek.WEDNESDAY,
  4: DayOfWeek.THURSDAY,
  5: DayOfWeek.FRIDAY,
  6: DayOfWeek.SATURDAY,
};

export const BACKEND_TO_DAY_NUM: Record<string, number> = {
  [DayOfWeek.SUNDAY]: 0,
  [DayOfWeek.MONDAY]: 1,
  [DayOfWeek.TUESDAY]: 2,
  [DayOfWeek.WEDNESDAY]: 3,
  [DayOfWeek.THURSDAY]: 4,
  [DayOfWeek.FRIDAY]: 5,
  [DayOfWeek.SATURDAY]: 6,
};

export const RECURRING_FRONT_TO_BACK: Record<string, RecurringPattern> = {
  daily: RecurringPattern.DAILY,
  weekly: RecurringPattern.WEEKLY,
  monthly: RecurringPattern.MONTHLY,
};

export const RECURRING_BACK_TO_FRONT: Record<RecurringPattern, string> = {
  [RecurringPattern.DAILY]: 'daily',
  [RecurringPattern.WEEKLY]: 'weekly',
  [RecurringPattern.MONTHLY]: 'monthly',
};
