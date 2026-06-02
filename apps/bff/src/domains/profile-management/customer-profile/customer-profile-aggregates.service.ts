import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Review } from '../../review/entities/review.entity';
import { ReviewerType } from '../../review/entities/reviewer-type.enum';
import {
  BookingRequest,
  BookingRequestStatus,
} from '../../booking/entities/booking-request.entity';
import { JobPosting } from '../../job-posting/entities/job-posting.entity';
import { WelperProfileAggregatesService } from '../welper-profile/welper-profile-aggregates.service';

export interface CustomerTrustAggregates {
  averageRating: number | null;
  reviewCount: number;
  completedBookingsCount: number;
  jobPostingsCount: number;
}

const COMPLETED_BOOKING_STATUSES: BookingRequestStatus[] = [
  BookingRequestStatus.COMPLETED,
  BookingRequestStatus.PAYMENT_RELEASED,
];

@Injectable()
export class CustomerProfileAggregatesService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(JobPosting)
    private readonly jobPostingRepo: Repository<JobPosting>,
  ) {}

  async getAggregates(customerId: string): Promise<CustomerTrustAggregates> {
    const [ratingAggregate, completedBookingsCount, jobPostingsCount] = await Promise.all([
      this.getRatingAggregate(customerId),
      this.getCompletedBookingsCount(customerId),
      this.getJobPostingsCount(customerId),
    ]);

    return {
      ...ratingAggregate,
      completedBookingsCount,
      jobPostingsCount,
    };
  }

  private async getRatingAggregate(
    customerId: string,
  ): Promise<{ averageRating: number | null; reviewCount: number }> {
    const stats = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.reviewee_id = :customerId', { customerId })
      .andWhere('r.reviewer_type = :reviewerType', {
        reviewerType: ReviewerType.WELPER,
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

  private async getCompletedBookingsCount(customerId: string): Promise<number> {
    return this.bookingRepo.count({
      where: {
        customerId,
        status: In(COMPLETED_BOOKING_STATUSES),
      },
    });
  }

  private async getJobPostingsCount(customerId: string): Promise<number> {
    return this.jobPostingRepo.count({ where: { customerId } });
  }
}
