import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { ReviewerType } from './entities/reviewer-type.enum';
import { BookingRequest } from '../booking/entities/booking-request.entity';
import { BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';

@Injectable()
export class ReviewService {
  private readonly logger = new Logger(ReviewService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    private readonly notificationService: NotificationService,
  ) {}

  private isReviewableBookingStatus(status: BookingRequestStatus): boolean {
    return (
      status === BookingRequestStatus.COMPLETED || status === BookingRequestStatus.PAYMENT_RELEASED
    );
  }

  private assertParticipant(
    booking: BookingRequest,
    userId: string,
    accountType: string,
  ): { isCustomer: boolean; isWelper: boolean } {
    const isCustomer = accountType === 'Customer' || accountType === 'customer';
    const isWelper = accountType === 'Welper' || accountType === 'welper';
    if (!isCustomer && !isWelper) {
      throw new ForbiddenException('Only customer or welper can submit a review');
    }
    if (isCustomer && booking.customerId !== userId) {
      throw new ForbiddenException('You are not the customer of this booking');
    }
    if (isWelper && booking.welperId !== userId) {
      throw new ForbiddenException('You are not the welper of this booking');
    }
    return { isCustomer, isWelper };
  }

  private async refreshWelperAggregateForReviewee(revieweeId: string): Promise<void> {
    const welperProfile = await this.welperProfileRepo.findOne({
      where: { welperId: revieweeId },
    });
    if (!welperProfile) return;
    // Bible §22.6 trust contract: a welper's public score is built only from
    // CUSTOMER → WELPER reviews. Welper-on-customer reviews must not skew the
    // welper's denormalized rating. Mirrors `WelperProfileAggregatesService`
    // which is the on-demand source of truth.
    const stats = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'count')
      .where('r.reviewee_id = :welperId', { welperId: revieweeId })
      .andWhere('r.reviewer_type = :reviewerType', {
        reviewerType: ReviewerType.CUSTOMER,
      })
      .getRawOne<{ avgRating: string; count: string }>();
    welperProfile.rating = stats?.avgRating != null ? parseFloat(stats.avgRating) : null;
    welperProfile.reviewCount = stats?.count != null ? parseInt(stats.count, 10) : 0;
    await this.welperProfileRepo.save(welperProfile);
  }

  async create(
    bookingId: string,
    userId: string,
    accountType: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!this.isReviewableBookingStatus(booking.status)) {
      throw new BadRequestException('Reviews are only available once the booking is finished');
    }

    const { isCustomer } = this.assertParticipant(booking, userId, accountType);

    const reviewerId = userId;
    const revieweeId = isCustomer ? booking.welperId : booking.customerId;
    const reviewerType = isCustomer ? ReviewerType.CUSTOMER : ReviewerType.WELPER;

    const existing = await this.reviewRepo.findOne({
      where: { bookingId, reviewerId },
    });
    if (existing) {
      throw new ConflictException('You have already submitted a review for this booking');
    }

    const review = this.reviewRepo.create({
      bookingId,
      reviewerId,
      revieweeId,
      reviewerType,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });
    const saved = await this.reviewRepo.save(review);
    await this.refreshWelperAggregateForReviewee(revieweeId);

    // NOTIFICATIONS-001 (Day 16 dispatch 2): notify the reviewee. Customer→
    // welper reviews ping the welper; welper→customer reviews ping the
    // customer. Body keeps the rating but not the comment — the comment can
    // be long; the recipient opens the booking detail to read it.
    //
    // TODO (REVIEWS-002 ship): also emit a `REVIEW` notification to the
    // ORIGINAL REVIEWER when the welper posts a public response. Wire that
    // into the welper-response create-path when REVIEWS-002 lands.
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const link = `${baseUrl}/dashboard/bookings/${booking.id}`;
    const title = isCustomer ? 'New review from your customer' : 'New review from your welper';
    const body = `You received a ${dto.rating}-star review for a recent booking. Open the booking to read it.`;
    try {
      await this.notificationService.emitForUser(revieweeId, {
        category: NotificationCategory.REVIEW,
        title,
        body,
        link,
        metadata: { bookingId: booking.id, reviewId: saved.id },
      });
    } catch (err) {
      this.logger.warn(
        `Failed to emit review notification for ${revieweeId}: ${(err as Error).message}`,
      );
    }

    return this.toDto(saved);
  }

  async update(
    bookingId: string,
    userId: string,
    accountType: string,
    dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (!this.isReviewableBookingStatus(booking.status)) {
      throw new BadRequestException('Reviews are only available once the booking is finished');
    }

    this.assertParticipant(booking, userId, accountType);

    const existing = await this.reviewRepo.findOne({
      where: { bookingId, reviewerId: userId },
    });
    if (!existing) {
      throw new NotFoundException('No review found to update for this booking');
    }

    existing.rating = dto.rating;
    existing.comment = dto.comment?.trim() || null;
    const saved = await this.reviewRepo.save(existing);
    await this.refreshWelperAggregateForReviewee(saved.revieweeId);

    return this.toDto(saved);
  }

  async getByBooking(bookingId: string, userId: string): Promise<ReviewResponseDto | null> {
    const review = await this.reviewRepo.findOne({
      where: { bookingId, reviewerId: userId },
    });
    return review ? this.toDto(review) : null;
  }

  async getReviewsForWelper(
    welperId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: ReviewResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const [reviews, total] = await this.reviewRepo.findAndCount({
      where: { revieweeId: welperId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data: reviews.map((r) => this.toDto(r)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  private toDto(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      bookingId: review.bookingId,
      reviewerId: review.reviewerId,
      revieweeId: review.revieweeId,
      reviewerType: review.reviewerType as ReviewerType,
      rating: review.rating,
      comment: review.comment ?? undefined,
      createdAt: review.createdAt.toISOString(),
    };
  }
}
