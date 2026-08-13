import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Review } from '../../review/entities/review.entity';
import { ReviewerType } from '../../review/entities/reviewer-type.enum';
import {
  BookingRequest,
  BookingRequestStatus,
} from '../../booking/entities/booking-request.entity';

export interface WelperTrustAggregates {
  /** Two-decimal precision average; null when reviewCount === 0. */
  averageRating: number | null;
  /** Count of customer-authored reviews. */
  reviewCount: number;
  /** Count of jobs that reached a completed, customer-paid state. */
  completedBookingsCount: number;
  /**
   * Integer minutes from booking-creation → welper-acceptance, averaged over
   * accepted bookings in the last 90 days. Null when fewer than 5 accepted
   * bookings — bible §22.6 forbids inflated SLA signals.
   */
  responseTimeMinutes: number | null;
}

const RESPONSE_TIME_MIN_BOOKINGS = 5;
const RESPONSE_TIME_WINDOW_DAYS = 90;
const COMPLETED_BOOKING_STATUSES: BookingRequestStatus[] = [
  BookingRequestStatus.COMPLETED,
  BookingRequestStatus.PAYMENT_RELEASED,
];

/**
 * On-demand aggregator for the welper trust signals exposed on the public
 * profile endpoint. Computes per-call instead of relying on denormalized
 * counters — Wave 1 prefers correctness over read-perf; if the workload
 * later shows this is hot, we can layer in a cache (see follow-ups in
 * AUDIT-LOG.md).
 */
@Injectable()
export class WelperProfileAggregatesService {
  private readonly logger = new Logger(WelperProfileAggregatesService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
  ) {}

  async getAggregates(welperId: string): Promise<WelperTrustAggregates> {
    const [ratingAggregate, completedBookingsCount, responseTimeMinutes] = await Promise.all([
      this.getRatingAggregate(welperId),
      this.getCompletedBookingsCount(welperId),
      this.getResponseTimeMinutes(welperId),
    ]);

    return {
      ...ratingAggregate,
      completedBookingsCount,
      responseTimeMinutes,
    };
  }

  private async getCompletedBookingsCount(welperId: string): Promise<number> {
    return this.bookingRepo.count({
      where: {
        welperId,
        status: In(COMPLETED_BOOKING_STATUSES),
      },
    });
  }

  /**
   * Round to 2 decimal places. Exposed for testing and reuse.
   */
  static roundRating(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async getRatingAggregate(
    welperId: string,
  ): Promise<{ averageRating: number | null; reviewCount: number }> {
    // Only count customer→welper reviews so welper-on-customer reviews don't
    // skew a welper's public rating.
    const stats = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.reviewee_id = :welperId', { welperId })
      .andWhere('r.reviewer_type = :reviewerType', {
        reviewerType: ReviewerType.CUSTOMER,
      })
      .getRawOne<{ avgRating: string | null; count: string | null }>();

    const reviewCount = stats?.count ? parseInt(stats.count, 10) : 0;
    if (reviewCount === 0 || !stats?.avgRating) {
      return { averageRating: null, reviewCount };
    }

    const avg = parseFloat(stats.avgRating);
    if (!Number.isFinite(avg)) {
      return { averageRating: null, reviewCount };
    }

    return {
      averageRating: WelperProfileAggregatesService.roundRating(avg),
      reviewCount,
    };
  }

  private async getResponseTimeMinutes(welperId: string): Promise<number | null> {
    const since = new Date(
      Date.now() - RESPONSE_TIME_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );

    // Status filter: any booking that has an `accepted_at` (i.e., the welper
    // accepted at some point). Includes the full post-accept lifecycle so
    // bookings that later progressed still count.
    const acceptedStatuses: BookingRequestStatus[] = [
      BookingRequestStatus.ACCEPTED,
      BookingRequestStatus.IN_PROGRESS,
      BookingRequestStatus.COMPLETED,
      BookingRequestStatus.PAYMENT_RELEASED,
      BookingRequestStatus.DISPUTED,
      BookingRequestStatus.NO_SHOW,
    ];

    const rows = await this.bookingRepo
      .createQueryBuilder('b')
      .select('b.created_at', 'createdAt')
      .addSelect('b.accepted_at', 'acceptedAt')
      .where('b.welper_id = :welperId', { welperId })
      .andWhere('b.accepted_at IS NOT NULL')
      .andWhere('b.accepted_at >= :since', { since })
      .andWhere('b.status IN (:...statuses)', { statuses: acceptedStatuses })
      .getRawMany<{ createdAt: Date | string; acceptedAt: Date | string }>();

    if (rows.length < RESPONSE_TIME_MIN_BOOKINGS) {
      return null;
    }

    let totalMinutes = 0;
    let counted = 0;
    for (const row of rows) {
      const created =
        row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
      const accepted =
        row.acceptedAt instanceof Date ? row.acceptedAt : new Date(row.acceptedAt);
      if (Number.isNaN(created.getTime()) || Number.isNaN(accepted.getTime())) {
        continue;
      }
      const diffMs = accepted.getTime() - created.getTime();
      if (diffMs < 0) {
        // Defensive: clock skew or backfilled rows; skip rather than poison the average.
        continue;
      }
      totalMinutes += diffMs / 60000;
      counted++;
    }

    if (counted < RESPONSE_TIME_MIN_BOOKINGS) {
      return null;
    }

    return Math.round(totalMinutes / counted);
  }
}
