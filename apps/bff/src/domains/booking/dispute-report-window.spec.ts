import { BookingRequest, BookingRequestStatus } from './entities/booking-request.entity';
import {
  getDisputeReportDeadlineAt,
  isDisputeReportWindowOpen,
  isBookingParticipantMessagingOpen,
} from './dispute-report-window';

function booking(partial: Partial<BookingRequest>): BookingRequest {
  return partial as BookingRequest;
}

describe('dispute-report-window', () => {
  const windowMinutes = 10;
  const completedAt = new Date('2026-05-30T10:00:00.000Z');

  it('allows reports while service is in progress', () => {
    const b = booking({ status: BookingRequestStatus.IN_PROGRESS });
    expect(isDisputeReportWindowOpen(b, windowMinutes, completedAt)).toBe(true);
    expect(getDisputeReportDeadlineAt(b, windowMinutes)).toBeNull();
  });

  it('allows reports within the post-completion window', () => {
    const b = booking({
      status: BookingRequestStatus.COMPLETED,
      completedAt,
    });
    const now = new Date('2026-05-30T10:09:59.000Z');
    expect(isDisputeReportWindowOpen(b, windowMinutes, now)).toBe(true);
    expect(getDisputeReportDeadlineAt(b, windowMinutes)?.toISOString()).toBe(
      '2026-05-30T10:10:00.000Z',
    );
  });

  it('blocks reports after the post-completion window', () => {
    const b = booking({
      status: BookingRequestStatus.COMPLETED,
      completedAt,
    });
    const now = new Date('2026-05-30T10:10:01.000Z');
    expect(isDisputeReportWindowOpen(b, windowMinutes, now)).toBe(false);
  });

  it('uses completedAt for payment_released bookings', () => {
    const b = booking({
      status: BookingRequestStatus.PAYMENT_RELEASED,
      completedAt,
    });
    expect(getDisputeReportDeadlineAt(b, windowMinutes)?.toISOString()).toBe(
      '2026-05-30T10:10:00.000Z',
    );
  });

  it('allows messaging before and during service', () => {
    expect(
      isBookingParticipantMessagingOpen(
        booking({ status: BookingRequestStatus.PENDING }),
        windowMinutes,
        completedAt,
      ),
    ).toBe(true);
    expect(
      isBookingParticipantMessagingOpen(
        booking({ status: BookingRequestStatus.IN_PROGRESS }),
        windowMinutes,
        completedAt,
      ),
    ).toBe(true);
  });

  it('blocks messaging after the post-completion window', () => {
    const b = booking({
      status: BookingRequestStatus.COMPLETED,
      completedAt,
    });
    const now = new Date('2026-05-30T10:11:00.000Z');
    expect(isBookingParticipantMessagingOpen(b, windowMinutes, now)).toBe(false);
  });
});
