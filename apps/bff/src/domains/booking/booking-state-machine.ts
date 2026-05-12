import { BadRequestException } from '@nestjs/common';
import { BookingRequestStatus } from './entities/booking-request.entity';

/**
 * Valid status transitions for booking requests.
 * Key = current status, Value = array of valid next statuses.
 */
const TRANSITIONS: Record<BookingRequestStatus, BookingRequestStatus[]> = {
  [BookingRequestStatus.PENDING]: [
    BookingRequestStatus.ACCEPTED,
    BookingRequestStatus.DECLINED,
    BookingRequestStatus.CANCELLED,
  ],
  [BookingRequestStatus.ACCEPTED]: [
    BookingRequestStatus.IN_PROGRESS,
    BookingRequestStatus.CANCELLED,
  ],
  [BookingRequestStatus.IN_PROGRESS]: [
    BookingRequestStatus.COMPLETED,
    BookingRequestStatus.DISPUTED,
  ],
  [BookingRequestStatus.COMPLETED]: [
    BookingRequestStatus.PAYMENT_RELEASED,
    BookingRequestStatus.DISPUTED,
  ],
  [BookingRequestStatus.PAYMENT_RELEASED]: [
    BookingRequestStatus.DISPUTED,
  ],
  [BookingRequestStatus.DECLINED]: [],
  [BookingRequestStatus.CANCELLED]: [],
  [BookingRequestStatus.DISPUTED]: [
    BookingRequestStatus.COMPLETED,
    BookingRequestStatus.CANCELLED,
  ],
  [BookingRequestStatus.NO_SHOW]: [
    BookingRequestStatus.CANCELLED,
    BookingRequestStatus.DISPUTED,
  ],
};

/**
 * Validate and enforce a status transition.
 * Throws BadRequestException if the transition is not allowed.
 */
export function validateTransition(
  currentStatus: BookingRequestStatus,
  nextStatus: BookingRequestStatus,
): void {
  const allowed = TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(nextStatus)) {
    throw new BadRequestException(
      `Cannot transition from "${currentStatus}" to "${nextStatus}"`,
    );
  }
}

/**
 * Check if a transition is valid without throwing.
 */
export function canTransition(
  currentStatus: BookingRequestStatus,
  nextStatus: BookingRequestStatus,
): boolean {
  const allowed = TRANSITIONS[currentStatus];
  return !!allowed && allowed.includes(nextStatus);
}

/**
 * Get all valid next statuses for the given current status.
 */
export function getValidTransitions(
  currentStatus: BookingRequestStatus,
): BookingRequestStatus[] {
  return TRANSITIONS[currentStatus] ?? [];
}
