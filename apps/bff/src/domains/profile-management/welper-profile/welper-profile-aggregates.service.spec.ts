import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfileAggregatesService } from './welper-profile-aggregates.service';
import { Review } from '../../review/entities/review.entity';
import { BookingRequest } from '../../booking/entities/booking-request.entity';

describe('WelperProfileAggregatesService', () => {
  let service: WelperProfileAggregatesService;
  let reviewRepo: Repository<Review>;
  let bookingRepo: Repository<BookingRequest>;

  const reviewQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const bookingQb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getRawMany: jest.fn(),
  };

  const mockReviewRepo = {
    createQueryBuilder: jest.fn(() => reviewQb),
  };
  const mockBookingRepo = {
    createQueryBuilder: jest.fn(() => bookingQb),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WelperProfileAggregatesService,
        { provide: getRepositoryToken(Review), useValue: mockReviewRepo },
        { provide: getRepositoryToken(BookingRequest), useValue: mockBookingRepo },
      ],
    }).compile();

    service = module.get<WelperProfileAggregatesService>(WelperProfileAggregatesService);
    reviewRepo = module.get<Repository<Review>>(getRepositoryToken(Review));
    bookingRepo = module.get<Repository<BookingRequest>>(getRepositoryToken(BookingRequest));
  });

  describe('rating aggregation (averageRating + reviewCount)', () => {
    it('returns null + 0 when there are no reviews (bible §22.6: no fake social proof)', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      bookingQb.getRawMany.mockResolvedValueOnce([]);

      const result = await service.getAggregates('w1');

      expect(result.averageRating).toBeNull();
      expect(result.reviewCount).toBe(0);
    });

    it('returns the rounded 2-decimal average when there is a single review', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: '5', count: '1' });
      bookingQb.getRawMany.mockResolvedValueOnce([]);

      const result = await service.getAggregates('w1');

      expect(result.averageRating).toBe(5);
      expect(result.reviewCount).toBe(1);
    });

    it('rounds to 2 decimal places (4.916666 -> 4.92)', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({
        avgRating: '4.916666666666',
        count: '12',
      });
      bookingQb.getRawMany.mockResolvedValueOnce([]);

      const result = await service.getAggregates('w1');

      expect(result.averageRating).toBe(4.92);
      expect(result.reviewCount).toBe(12);
    });

    it('returns null average when avg comes back as a non-finite number', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: 'not-a-number', count: '3' });
      bookingQb.getRawMany.mockResolvedValueOnce([]);

      const result = await service.getAggregates('w1');

      expect(result.averageRating).toBeNull();
      expect(result.reviewCount).toBe(3);
    });
  });

  describe('responseTimeMinutes (booking-accept latency)', () => {
    const mkRow = (createdAtMinutesAgo: number, acceptedAtMinutesAgo: number) => ({
      createdAt: new Date(Date.now() - createdAtMinutesAgo * 60_000),
      acceptedAt: new Date(Date.now() - acceptedAtMinutesAgo * 60_000),
    });

    it('returns null when fewer than 5 accepted bookings (bible §22.6: no inflated SLA)', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      bookingQb.getRawMany.mockResolvedValueOnce([
        mkRow(60, 30),
        mkRow(60, 30),
        mkRow(60, 30),
        mkRow(60, 30),
      ]);

      const result = await service.getAggregates('w1');

      expect(result.responseTimeMinutes).toBeNull();
    });

    it('returns the rounded average minutes when at least 5 accepted bookings', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      bookingQb.getRawMany.mockResolvedValueOnce([
        mkRow(60, 50), // 10 min
        mkRow(60, 40), // 20 min
        mkRow(60, 30), // 30 min
        mkRow(60, 20), // 40 min
        mkRow(60, 10), // 50 min
      ]);

      const result = await service.getAggregates('w1');

      // average = (10+20+30+40+50)/5 = 30
      expect(result.responseTimeMinutes).toBe(30);
    });

    it('returns null at exactly 4 bookings, integer at exactly 5', async () => {
      // 4 bookings -> null
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      bookingQb.getRawMany.mockResolvedValueOnce([
        mkRow(60, 50),
        mkRow(60, 50),
        mkRow(60, 50),
        mkRow(60, 50),
      ]);
      const four = await service.getAggregates('w1');
      expect(four.responseTimeMinutes).toBeNull();

      // 5 bookings -> integer
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      bookingQb.getRawMany.mockResolvedValueOnce([
        mkRow(60, 50),
        mkRow(60, 50),
        mkRow(60, 50),
        mkRow(60, 50),
        mkRow(60, 50),
      ]);
      const five = await service.getAggregates('w1');
      expect(five.responseTimeMinutes).toBe(10);
    });

    it('skips rows with negative latency (clock skew / backfill defence)', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      bookingQb.getRawMany.mockResolvedValueOnce([
        mkRow(60, 50), // 10
        mkRow(60, 50), // 10
        mkRow(60, 50), // 10
        mkRow(60, 50), // 10
        mkRow(60, 50), // 10
        // accepted before created — skipped
        { createdAt: new Date(), acceptedAt: new Date(Date.now() - 60_000) },
      ]);

      const result = await service.getAggregates('w1');

      // 5 valid rows × 10 min average; the negative row is skipped.
      expect(result.responseTimeMinutes).toBe(10);
    });

    it('handles ISO-string timestamps from raw query rows', async () => {
      reviewQb.getRawOne.mockResolvedValueOnce({ avgRating: null, count: '0' });
      const baseCreated = new Date(Date.now() - 60 * 60_000).toISOString();
      const baseAccepted = new Date(Date.now() - 50 * 60_000).toISOString();
      bookingQb.getRawMany.mockResolvedValueOnce(
        Array.from({ length: 5 }, () => ({
          createdAt: baseCreated,
          acceptedAt: baseAccepted,
        })),
      );

      const result = await service.getAggregates('w1');

      // All 5 rows = 10 min each.
      expect(result.responseTimeMinutes).toBe(10);
    });
  });

  describe('roundRating static helper', () => {
    it('rounds positive numbers to 2 decimal places', () => {
      expect(WelperProfileAggregatesService.roundRating(4.916666)).toBe(4.92);
      expect(WelperProfileAggregatesService.roundRating(4.914)).toBe(4.91);
      expect(WelperProfileAggregatesService.roundRating(5)).toBe(5);
    });
  });
});
