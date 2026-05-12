import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { ReviewService } from './review.service';
import { Review } from './entities/review.entity';
import { ReviewerType } from './entities/reviewer-type.enum';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';

/**
 * Day 12 audit: review service contract.
 *
 * Bible §22.6 trust contract: a welper's denormalized rating MUST be built
 * only from CUSTOMER → WELPER reviews. `WelperProfileAggregatesService`
 * (Wave 1) handles the public read path; `ReviewService.create/update` is
 * the write path. The audit found `refreshWelperAggregateForReviewee` was
 * NOT filtering by `reviewer_type = customer` — relying on the implicit
 * `revieweeId` schism (welper-on-customer reviews wouldn't match a welper
 * profile). That worked but was contract-fragile; if a future migration ever
 * stored welper-on-welper or test rows under a welper id, the score would
 * silently drift. The fix mirrors the public aggregator's filter.
 *
 * Other locked behaviours:
 *  - participant authorization (only the booking customer / welper can review)
 *  - reviewable status (only after COMPLETED / PAYMENT_RELEASED)
 *  - one-review-per-reviewer-per-booking (idempotency via Conflict)
 */
describe('ReviewService', () => {
  let service: ReviewService;
  let reviewRepo: jest.Mocked<Repository<Review>>;
  let bookingRepo: jest.Mocked<Repository<BookingRequest>>;
  let welperProfileRepo: jest.Mocked<Repository<WelperProfile>>;

  const BOOKING_ID = '00000000-0000-0000-0000-000000000001';
  const CUSTOMER_ID = '00000000-0000-0000-0000-000000000002';
  const WELPER_ID = '00000000-0000-0000-0000-000000000003';

  const completedBooking = {
    id: BOOKING_ID,
    customerId: CUSTOMER_ID,
    welperId: WELPER_ID,
    status: BookingRequestStatus.COMPLETED,
  } as BookingRequest;

  const mockReviewRepo = {
    findOne: jest.fn(),
    findAndCount: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockBookingRepo = {
    findOne: jest.fn(),
  };

  const mockWelperProfileRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  // NOTIFICATIONS-001 (Day 16 dispatch 2): ReviewService now emits a
  // notification on `create`. The mock returns null (skipped) by default so
  // existing happy-path specs that don't care about the emit still pass.
  const mockNotificationService = {
    emitForUser: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
        { provide: getRepositoryToken(WelperProfile), useValue: mockWelperProfileRepo },
        { provide: NotificationService, useValue: mockNotificationService },
      ],
    }).compile();

    service = module.get<ReviewService>(ReviewService);
    reviewRepo = module.get(getRepositoryToken(Review));
    bookingRepo = module.get(getRepositoryToken(BookingRequest));
    welperProfileRepo = module.get(getRepositoryToken(WelperProfile));
  });

  /** Build a chainable QB mock that returns the given raw row from getRawOne. */
  function mockAggregateQb(raw: { avgRating: string | null; count: string | null }) {
    const captured: { conditions: Array<{ where: string; params: unknown }> } = {
      conditions: [],
    };
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn((w: string, p: unknown) => {
        captured.conditions.push({ where: w, params: p });
        return qb;
      }),
      andWhere: jest.fn((w: string, p: unknown) => {
        captured.conditions.push({ where: w, params: p });
        return qb;
      }),
      getRawOne: jest.fn().mockResolvedValue(raw),
    };
    reviewRepo.createQueryBuilder.mockReturnValue(qb as never);
    return { qb, captured };
  }

  describe('create — trust contract', () => {
    it('refreshes welper aggregate with reviewer_type = customer filter applied', async () => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockImplementation((args) => args as Review);
      reviewRepo.save.mockImplementation((r) =>
        Promise.resolve({
          ...(r as Review),
          id: '00000000-0000-0000-0000-0000000000aa',
          createdAt: new Date(),
        } as Review),
      );

      welperProfileRepo.findOne.mockResolvedValue({
        welperId: WELPER_ID,
        rating: null,
        reviewCount: 0,
      } as unknown as WelperProfile);
      welperProfileRepo.save.mockImplementation((p) => Promise.resolve(p as WelperProfile));

      const { captured } = mockAggregateQb({ avgRating: '4.5', count: '2' });

      await service.create(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5 });

      // The query must filter by both reviewee_id AND reviewer_type — the
      // customer-only filter is the §22.6 trust contract.
      const wheres = captured.conditions
        .map((c) => c.where)
        .join(' | ');
      expect(wheres).toContain('reviewee_id');
      expect(wheres).toContain('reviewer_type');

      const params = Object.assign(
        {},
        ...captured.conditions.map((c) => c.params as Record<string, unknown>),
      ) as Record<string, unknown>;
      expect(params.reviewerType).toBe(ReviewerType.CUSTOMER);
    });
  });

  describe('create — guards', () => {
    it('throws BadRequest when booking is not in a reviewable status', async () => {
      bookingRepo.findOne.mockResolvedValue({
        ...completedBooking,
        status: BookingRequestStatus.PENDING,
      } as BookingRequest);

      await expect(
        service.create(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5 }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws Forbidden when caller is the booking welper but accountType says customer', async () => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);

      await expect(
        service.create(BOOKING_ID, WELPER_ID, 'Customer', { rating: 5 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Forbidden when caller is neither customer nor welper of the booking', async () => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);

      await expect(
        service.create(BOOKING_ID, '00000000-0000-0000-0000-0000000000ff', 'Customer', {
          rating: 5,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws Conflict when the same reviewer tries to submit twice for the same booking', async () => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);
      reviewRepo.findOne.mockResolvedValue({ id: 'existing' } as Review);

      await expect(
        service.create(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5 }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws NotFound when booking does not exist', async () => {
      bookingRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates an existing review and refreshes aggregate', async () => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);
      reviewRepo.findOne.mockResolvedValue({
        id: 'existing',
        bookingId: BOOKING_ID,
        reviewerId: CUSTOMER_ID,
        revieweeId: WELPER_ID,
        rating: 4,
        comment: null,
        reviewerType: ReviewerType.CUSTOMER,
        createdAt: new Date('2026-04-25T12:00:00Z'),
      } as unknown as Review);
      reviewRepo.save.mockImplementation((r) => Promise.resolve(r as Review));
      welperProfileRepo.findOne.mockResolvedValue({
        welperId: WELPER_ID,
      } as WelperProfile);
      welperProfileRepo.save.mockImplementation((p) => Promise.resolve(p as WelperProfile));
      mockAggregateQb({ avgRating: '5', count: '1' });

      const result = await service.update(BOOKING_ID, CUSTOMER_ID, 'Customer', {
        rating: 5,
        comment: 'updated',
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('updated');
    });

    it('throws NotFound when review does not exist for the caller', async () => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);
      reviewRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('create — NOTIFICATIONS-001 emit contract', () => {
    beforeEach(() => {
      bookingRepo.findOne.mockResolvedValue(completedBooking);
      reviewRepo.findOne.mockResolvedValue(null);
      reviewRepo.create.mockImplementation((args) => args as Review);
      reviewRepo.save.mockImplementation((r) =>
        Promise.resolve({
          ...(r as Review),
          id: '00000000-0000-0000-0000-0000000000aa',
          createdAt: new Date(),
        } as Review),
      );
      welperProfileRepo.findOne.mockResolvedValue({
        welperId: WELPER_ID,
        rating: null,
        reviewCount: 0,
      } as unknown as WelperProfile);
      welperProfileRepo.save.mockImplementation((p) => Promise.resolve(p as WelperProfile));
      mockAggregateQb({ avgRating: '5', count: '1' });
    });

    it('emits a REVIEW notification to the welper when a customer reviews them', async () => {
      await service.create(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5, comment: 'great' });

      expect(mockNotificationService.emitForUser).toHaveBeenCalledTimes(1);
      const [recipient, params] = mockNotificationService.emitForUser.mock.calls[0]!;
      expect(recipient).toBe(WELPER_ID);
      expect(params.category).toBe(NotificationCategory.REVIEW);
      expect(params.title).toContain('review');
      expect(params.body).toContain('5-star');
      expect(params.link).toContain(`/dashboard/bookings/${BOOKING_ID}`);
      expect(params.metadata).toMatchObject({ bookingId: BOOKING_ID });
    });

    it('emits a REVIEW notification to the customer when a welper reviews them', async () => {
      await service.create(BOOKING_ID, WELPER_ID, 'Welper', { rating: 4 });

      expect(mockNotificationService.emitForUser).toHaveBeenCalledTimes(1);
      const [recipient] = mockNotificationService.emitForUser.mock.calls[0]!;
      expect(recipient).toBe(CUSTOMER_ID);
    });

    it('does not crash when the notification emit fails — review write still succeeds', async () => {
      mockNotificationService.emitForUser.mockRejectedValueOnce(new Error('email service down'));

      await expect(
        service.create(BOOKING_ID, CUSTOMER_ID, 'Customer', { rating: 5 }),
      ).resolves.toMatchObject({ rating: 5 });
    });
  });

  describe('getReviewsForWelper', () => {
    it('returns paginated list with totalPages floor of 1 for empty results', async () => {
      reviewRepo.findAndCount.mockResolvedValue([[], 0]);
      const out = await service.getReviewsForWelper(WELPER_ID, 1, 20);
      expect(out.data).toEqual([]);
      expect(out.total).toBe(0);
      expect(out.page).toBe(1);
      expect(out.limit).toBe(20);
      expect(out.totalPages).toBe(1);
    });
  });
});
