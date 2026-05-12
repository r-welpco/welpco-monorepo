import { BadRequestException } from '@nestjs/common';
import { BookingRequestStatus } from './entities/booking-request.entity';
import {
  validateTransition,
  canTransition,
  getValidTransitions,
} from './booking-state-machine';

describe('BookingStateMachine', () => {
  describe('validateTransition', () => {
    it('allows PENDING -> ACCEPTED', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.PENDING, BookingRequestStatus.ACCEPTED),
      ).not.toThrow();
    });

    it('allows PENDING -> DECLINED', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.PENDING, BookingRequestStatus.DECLINED),
      ).not.toThrow();
    });

    it('allows PENDING -> CANCELLED', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.PENDING, BookingRequestStatus.CANCELLED),
      ).not.toThrow();
    });

    it('throws for PENDING -> IN_PROGRESS', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.PENDING, BookingRequestStatus.IN_PROGRESS),
      ).toThrow(BadRequestException);
      expect(() =>
        validateTransition(BookingRequestStatus.PENDING, BookingRequestStatus.IN_PROGRESS),
      ).toThrow(/Cannot transition from "pending" to "in_progress"/);
    });

    it('allows ACCEPTED -> IN_PROGRESS', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.ACCEPTED, BookingRequestStatus.IN_PROGRESS),
      ).not.toThrow();
    });

    it('allows ACCEPTED -> CANCELLED', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.ACCEPTED, BookingRequestStatus.CANCELLED),
      ).not.toThrow();
    });

    it('allows IN_PROGRESS -> COMPLETED', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.IN_PROGRESS, BookingRequestStatus.COMPLETED),
      ).not.toThrow();
    });

    it('throws for DECLINED -> any', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.DECLINED, BookingRequestStatus.CANCELLED),
      ).toThrow(BadRequestException);
    });

    it('throws for CANCELLED -> any', () => {
      expect(() =>
        validateTransition(BookingRequestStatus.CANCELLED, BookingRequestStatus.PENDING),
      ).toThrow(BadRequestException);
    });

    describe('disputed lifecycle', () => {
      it('allows IN_PROGRESS -> DISPUTED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.IN_PROGRESS, BookingRequestStatus.DISPUTED),
        ).not.toThrow();
      });

      it('allows COMPLETED -> DISPUTED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.COMPLETED, BookingRequestStatus.DISPUTED),
        ).not.toThrow();
      });

      it('allows PAYMENT_RELEASED -> DISPUTED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.PAYMENT_RELEASED, BookingRequestStatus.DISPUTED),
        ).not.toThrow();
      });

      it('allows NO_SHOW -> DISPUTED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.NO_SHOW, BookingRequestStatus.DISPUTED),
        ).not.toThrow();
      });

      it('allows DISPUTED -> COMPLETED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.DISPUTED, BookingRequestStatus.COMPLETED),
        ).not.toThrow();
      });

      it('allows DISPUTED -> CANCELLED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.DISPUTED, BookingRequestStatus.CANCELLED),
        ).not.toThrow();
      });

      it('throws for DISPUTED -> IN_PROGRESS', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.DISPUTED, BookingRequestStatus.IN_PROGRESS),
        ).toThrow(BadRequestException);
      });

      it('throws for PENDING -> DISPUTED', () => {
        expect(() =>
          validateTransition(BookingRequestStatus.PENDING, BookingRequestStatus.DISPUTED),
        ).toThrow(BadRequestException);
      });
    });
  });

  describe('canTransition', () => {
    it('returns true for valid transition', () => {
      expect(canTransition(BookingRequestStatus.PENDING, BookingRequestStatus.ACCEPTED)).toBe(true);
    });

    it('returns false for invalid transition', () => {
      expect(canTransition(BookingRequestStatus.PENDING, BookingRequestStatus.COMPLETED)).toBe(false);
    });

    it('returns false for terminal state', () => {
      expect(canTransition(BookingRequestStatus.DECLINED, BookingRequestStatus.CANCELLED)).toBe(
        false,
      );
    });

    it('returns true for DISPUTED -> COMPLETED and false for DISPUTED -> IN_PROGRESS', () => {
      expect(
        canTransition(BookingRequestStatus.DISPUTED, BookingRequestStatus.COMPLETED),
      ).toBe(true);
      expect(
        canTransition(BookingRequestStatus.DISPUTED, BookingRequestStatus.CANCELLED),
      ).toBe(true);
      expect(
        canTransition(BookingRequestStatus.DISPUTED, BookingRequestStatus.IN_PROGRESS),
      ).toBe(false);
    });
  });

  describe('getValidTransitions', () => {
    it('returns next statuses for PENDING', () => {
      const next = getValidTransitions(BookingRequestStatus.PENDING);
      expect(next).toContain(BookingRequestStatus.ACCEPTED);
      expect(next).toContain(BookingRequestStatus.DECLINED);
      expect(next).toContain(BookingRequestStatus.CANCELLED);
      expect(next).toHaveLength(3);
    });

    it('returns empty array for DECLINED', () => {
      const next = getValidTransitions(BookingRequestStatus.DECLINED);
      expect(next).toEqual([]);
    });

    it('returns empty array for CANCELLED', () => {
      const next = getValidTransitions(BookingRequestStatus.CANCELLED);
      expect(next).toEqual([]);
    });

    it('returns next statuses for ACCEPTED (check-in or cancel)', () => {
      const next = getValidTransitions(BookingRequestStatus.ACCEPTED);
      expect(next).toContain(BookingRequestStatus.IN_PROGRESS);
      expect(next).toContain(BookingRequestStatus.CANCELLED);
      expect(next).toHaveLength(2);
    });

    it('returns next statuses for NO_SHOW (legacy rows)', () => {
      const next = getValidTransitions(BookingRequestStatus.NO_SHOW);
      expect(next).toContain(BookingRequestStatus.CANCELLED);
      expect(next).toContain(BookingRequestStatus.DISPUTED);
    });

    it('returns COMPLETED and CANCELLED only for DISPUTED', () => {
      const next = getValidTransitions(BookingRequestStatus.DISPUTED);
      expect(next).toContain(BookingRequestStatus.COMPLETED);
      expect(next).toContain(BookingRequestStatus.CANCELLED);
      expect(next).toHaveLength(2);
    });
  });
});
