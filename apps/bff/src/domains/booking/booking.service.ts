import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { BookingRequest, BookingRequestStatus } from './entities/booking-request.entity';
import { BookingServiceReceipt } from './entities/booking-service-receipt.entity';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { BookingListQueryDto } from './dto/booking-list-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { SubmitServiceReceiptDto } from './dto/submit-service-receipt.dto';
import {
  ConfirmServiceReceiptResponseDto,
  ServiceReceiptDraftDto,
} from './dto/service-receipt.dto';
import { ServiceReceiptDto, ReceiptEvidenceFileDto } from './dto/service-receipt-summary.dto';
import { S3UrlPresignerService } from '../../clients/s3';
import { ServiceOfferingService } from '../profile-management/service-offering/service-offering.service';
import { ServiceQuestionsService } from '../content-management/service-questions/service-questions.service';
import { AvailabilityService } from '../profile-management/availability/availability.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { PaymentService } from '../payment/payment.service';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { UsersService } from '../user-management/users/users.service';
import { BackgroundCheckService } from '../safety-verification/background-check.service';
import { ApplicationSettingsService } from '../payment/application-settings.service';
import { validateTransition, getValidTransitions } from './booking-state-machine';
import type { ServiceQuestion } from '../content-management/entities/service-question.entity';

/** Hours before scheduled time when free cancellation is no longer possible */
const FREE_CANCELLATION_HOURS = 24;
const MAX_RECEIPT_BILLING_MINUTES = 720;
const RECEIPT_SCHEDULE_GRACE_BEFORE_MINUTES = 60;
const RECEIPT_SCHEDULE_GRACE_AFTER_MINUTES = 120;
const RECEIPT_FUTURE_GRACE_MINUTES = 5;

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(BookingServiceReceipt)
    private readonly serviceReceiptRepo: Repository<BookingServiceReceipt>,
    private readonly dataSource: DataSource,
    private readonly serviceOfferingService: ServiceOfferingService,
    private readonly serviceQuestionsService: ServiceQuestionsService,
    private readonly availabilityService: AvailabilityService,
    private readonly notificationService: NotificationService,
    private readonly paymentService: PaymentService,
    private readonly applicationSettings: ApplicationSettingsService,
    private readonly customerProfileService: CustomerProfileService,
    private readonly welperProfileService: WelperProfileService,
    private readonly usersService: UsersService,
    private readonly s3Presigner: S3UrlPresignerService,
    private readonly backgroundCheckService: BackgroundCheckService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────

  private isServiceQuestionVisible(
    sq: ServiceQuestion,
    answers: Record<string, string | number | boolean>,
  ): boolean {
    const cl = sq.conditionalLogic;
    if (!cl?.showIf) return true;
    return answers[cl.showIf.questionId] === cl.showIf.value;
  }

  private isAnswerValid(value: string | number | boolean | undefined): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    return true;
  }

  /** Normalize time to HH:mm for consistent API contract */
  private normalizeTime(t: string | null | undefined): string | null {
    if (t == null) return null;
    const s = String(t);
    return s.length >= 5 ? s.slice(0, 5) : s;
  }

  private toResponse(
    booking: BookingRequest,
    userId: string,
    userRole: 'customer' | 'welper',
  ): BookingResponseDto {
    const actions = this.getAvailableActions(booking, userId, userRole);
    return {
      id: booking.id,
      customerId: booking.customerId,
      welperId: booking.welperId,
      serviceOfferingId: booking.serviceOfferingId,
      status: booking.status,
      answers: booking.answers,
      scheduledDate: booking.scheduledDate,
      scheduledStartTime: this.normalizeTime(booking.scheduledStartTime),
      scheduledEndTime: this.normalizeTime(booking.scheduledEndTime),
      durationMinutes: booking.durationMinutes,
      hourlyRate: booking.hourlyRate ? Number(booking.hourlyRate) : null,
      totalPrice: booking.totalPrice ? Number(booking.totalPrice) : null,
      address: booking.address,
      notes: booking.notes,
      cancellationReason: booking.cancellationReason,
      declineReason: booking.declineReason,
      acceptedAt: booking.acceptedAt,
      declinedAt: booking.declinedAt,
      cancelledAt: booking.cancelledAt,
      checkedInAt: booking.checkedInAt,
      checkedOutAt: booking.checkedOutAt,
      completedAt: booking.completedAt,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
      availableActions: actions,
    };
  }

  private getAvailableActions(
    booking: BookingRequest,
    userId: string,
    userRole: 'customer' | 'welper',
  ): string[] {
    const validNextStatuses = getValidTransitions(booking.status);
    const actions: string[] = [];

    for (const next of validNextStatuses) {
      if (next === BookingRequestStatus.ACCEPTED && userRole === 'welper' && booking.welperId === userId) {
        actions.push('accept');
      }
      if (next === BookingRequestStatus.DECLINED && userRole === 'welper' && booking.welperId === userId) {
        actions.push('decline');
      }
      if (next === BookingRequestStatus.CANCELLED && booking.status !== BookingRequestStatus.DISPUTED) {
        actions.push('cancel');
      }
      if (next === BookingRequestStatus.IN_PROGRESS && userRole === 'welper' && booking.welperId === userId) {
        actions.push('check-in');
      }
      if (
        next === BookingRequestStatus.COMPLETED &&
        userRole === 'welper' &&
        booking.welperId === userId &&
        booking.status === BookingRequestStatus.IN_PROGRESS
      ) {
        actions.push('check-out');
      }
    }

    return actions;
  }

  private computeReceiptSubtotalCents(checkIn: Date, checkOut: Date, hourlyRate: number): number {
    const ms = checkOut.getTime() - checkIn.getTime();
    if (ms <= 0) {
      throw new BadRequestException('Billing check-out must be after check-in');
    }
    const hours = ms / (1000 * 60 * 60);
    return Math.round(hours * hourlyRate * 100);
  }

  private computeTaxCents(subtotalCents: number, taxRateBps: number): number {
    if (subtotalCents <= 0 || taxRateBps <= 0) return 0;
    return Math.round((subtotalCents * taxRateBps) / 10000);
  }

  private assertReceiptBillingWindowReasonable(
    booking: BookingRequest,
    checkIn: Date,
    checkOut: Date,
  ): void {
    const ms = checkOut.getTime() - checkIn.getTime();
    if (ms <= 0) {
      throw new BadRequestException('Billing check-out must be after check-in');
    }

    const durationMinutes = ms / (1000 * 60);
    if (durationMinutes > MAX_RECEIPT_BILLING_MINUTES) {
      throw new BadRequestException(
        `Billing duration cannot exceed ${MAX_RECEIPT_BILLING_MINUTES / 60} hours`,
      );
    }

    if (checkOut.getTime() > Date.now() + RECEIPT_FUTURE_GRACE_MINUTES * 60 * 1000) {
      throw new BadRequestException('Billing check-out cannot be in the future');
    }

    if (booking.scheduledDate && booking.scheduledStartTime && booking.scheduledEndTime) {
      const offset = booking.timezoneOffsetMinutes ?? null;
      const scheduledStartMs = this.scheduledTimeToUtcMs(
        booking.scheduledDate,
        booking.scheduledStartTime,
        offset,
      );
      const scheduledEndMs = this.scheduledTimeToUtcMs(
        booking.scheduledDate,
        booking.scheduledEndTime,
        offset,
      );
      const earliestMs =
        scheduledStartMs - RECEIPT_SCHEDULE_GRACE_BEFORE_MINUTES * 60 * 1000;
      const latestMs =
        scheduledEndMs + RECEIPT_SCHEDULE_GRACE_AFTER_MINUTES * 60 * 1000;

      if (checkIn.getTime() < earliestMs) {
        throw new BadRequestException('Billing check-in is too far before the scheduled start');
      }
      if (checkOut.getTime() > latestMs) {
        throw new BadRequestException('Billing check-out is too far after the scheduled end');
      }
    }
  }

  /**
   * Wave 2: presigns each evidence file's S3 key and returns the DTO shape the
   * client consumes. `evidenceFiles` is always an array (never undefined).
   * `signedUrl` is `null` when the presigner isn't configured (local dev / no
   * AWS creds) or signing failed — the metadata still flows so the client can
   * surface filename/icon UI even when downloads aren't available.
   */
  private async toServiceReceiptDto(r: BookingServiceReceipt): Promise<ServiceReceiptDto> {
    const sourceFiles = Array.isArray(r.evidenceFiles) ? r.evidenceFiles : [];
    const evidenceFiles: ReceiptEvidenceFileDto[] = await Promise.all(
      sourceFiles
        .filter((f) => f && typeof f.key === 'string' && f.key.length > 0)
        .map(async (f) => ({
          ...(f.id != null ? { id: f.id } : {}),
          key: f.key,
          signedUrl: await this.s3Presigner.presignGet(f.key),
        })),
    );

    return {
      id: r.id,
      bookingId: r.bookingId,
      billingCheckInAt: r.billingCheckInAt.toISOString(),
      billingCheckOutAt: r.billingCheckOutAt.toISOString(),
      hourlyRate: Number(r.hourlyRate),
      subtotalCents: r.subtotalCents ?? Math.max(0, r.totalCents - (r.taxCents ?? 0)),
      taxCents: r.taxCents ?? 0,
      taxRateBps: r.taxRateBps ?? 0,
      totalCents: r.totalCents,
      currency: r.currency,
      notes: r.notes,
      confirmedAt: r.confirmedAt.toISOString(),
      sentToCustomerAt: r.sentToCustomerAt?.toISOString() ?? null,
      evidenceFiles,
    };
  }

  private async attachPaymentAndReceipt(dto: BookingResponseDto, bookingId: string): Promise<void> {
    const pay = await this.paymentService.getBookingPaymentSummary(bookingId);
    if (pay) {
      dto.paymentPhase = pay.phase;
      dto.captureEligibleAt = pay.captureEligibleAt;
    }
    const receipt = await this.serviceReceiptRepo.findOne({ where: { bookingId } });
    dto.serviceReceipt = receipt ? await this.toServiceReceiptDto(receipt) : null;
  }

  private async withTransaction<T>(fn: (queryRunner: QueryRunner) => Promise<T>): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const result = await fn(queryRunner);
      await queryRunner.commitTransaction();
      return result;
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  // ─── Create ───────────────────────────────────────────────────────────

  async create(
    customerId: string,
    dto: CreateBookingRequestDto,
  ): Promise<BookingResponseDto> {
    const offering = await this.serviceOfferingService.findById(dto.offeringId);
    if (offering.welperId !== dto.welperId) {
      throw new BadRequestException('Offering does not belong to the specified welper');
    }
    if (!offering.active) {
      throw new BadRequestException('Cannot book an inactive offering');
    }
    if (customerId === dto.welperId) {
      throw new BadRequestException('Cannot book your own service');
    }

    await this.paymentService.assertCustomerHasDefaultPaymentMethod(customerId);

    // Validate service question answers
    const answers = dto.answers ?? {};
    const serviceQuestions = await this.serviceQuestionsService.findByServiceCategory(offering.serviceCategoryId);
    const requiredVisible = serviceQuestions.filter(
      (sq) => sq.isRequired && this.isServiceQuestionVisible(sq, answers),
    );
    const firstMissing = requiredVisible.find((sq) => !this.isAnswerValid(answers[sq.questionId]));
    if (firstMissing) {
      const label = firstMissing.question?.label ?? firstMissing.questionId;
      throw new BadRequestException(`Missing required answer for: ${label}`);
    }

    // Calculate pricing
    let hourlyRate: number | null = null;
    let totalPrice: number | null = null;
    if (offering.hourlyRate) {
      hourlyRate = Number(offering.hourlyRate);
      if (dto.durationMinutes) {
        const subtotal = Math.round(hourlyRate * (dto.durationMinutes / 60) * 100) / 100;
        const taxRateBps = await this.applicationSettings.getBookingTaxRateBps();
        const tax = Math.round(((subtotal * taxRateBps) / 10000) * 100) / 100;
        totalPrice = Math.round((subtotal + tax) * 100) / 100;
      }
    }

    const saved = await this.withTransaction(async (queryRunner) => {
      const available = await this.availabilityService.isSlotAvailable(
        dto.welperId,
        dto.scheduledDate,
        dto.scheduledStartTime,
        dto.scheduledEndTime,
      );
      if (!available) {
        throw new BadRequestException(
          'The requested date and time are not available in the welper\'s schedule',
        );
      }
      await this.checkConflictsInTransaction(
        queryRunner,
        dto.welperId,
        dto.scheduledDate,
        dto.scheduledStartTime,
        dto.scheduledEndTime,
      );

      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
      const request = bookingRepo.create({
        customerId,
        welperId: dto.welperId,
        serviceOfferingId: dto.offeringId,
        answers,
        status: BookingRequestStatus.PENDING,
        scheduledDate: dto.scheduledDate,
        scheduledStartTime: dto.scheduledStartTime,
        scheduledEndTime: dto.scheduledEndTime,
        durationMinutes: dto.durationMinutes,
        timezoneOffsetMinutes: dto.timezoneOffsetMinutes ?? null,
        hourlyRate,
        totalPrice,
        address: dto.address ?? null,
        notes: dto.notes ?? null,
      });

      return bookingRepo.save(request);
    });

    this.logger.log(`Booking ${saved.id} created by customer ${customerId} for welper ${dto.welperId}`);
    const customerName = await this.resolvePersonDisplayName('customer', customerId, 'A customer');
    await this.notifyBookingEvent(
      saved,
      dto.welperId,
      'booking_created',
      'New booking request',
      'You have a new booking request.',
      { customerName },
      offering,
    );
    return this.toResponse(saved, customerId, 'customer');
  }

  // ─── Read ─────────────────────────────────────────────────────────────

  async findById(
    bookingId: string,
    userId: string,
    accountType: string,
  ): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    // Only the customer or welper involved can view the booking
    if (booking.customerId !== userId && booking.welperId !== userId) {
      throw new ForbiddenException('You are not authorized to view this booking');
    }
    const role = accountType.toLowerCase() === 'welper' ? 'welper' as const : 'customer' as const;
    const dto = this.toResponse(booking, userId, role);
    await this.attachPaymentAndReceipt(dto, bookingId);
    if (role === 'customer' && dto.paymentPhase === 'requires_action') {
      dto.paymentClientSecret = await this.paymentService.getClientSecretForReceiptDeltaIfRequired(
        bookingId,
        userId,
      );
    }
    return dto;
  }

  /** Read-only booking detail for platform admins (support). */
  async findByIdForAdmin(bookingId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    const dto = this.toResponse(booking, booking.customerId, 'customer');
    dto.availableActions = [];
    await this.attachPaymentAndReceipt(dto, bookingId);
    return dto;
  }

  async createPaymentIntentForBooking(
    bookingId: string,
    userId: string,
    accountType: string,
  ) {
    return this.paymentService.createBookingAuthorizationIntent(bookingId, userId, accountType);
  }

  async findAll(
    userId: string,
    accountType: string,
    query: BookingListQueryDto,
  ): Promise<{ data: BookingResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    // Always derive role from the authenticated user's accountType — never trust query param
    const role = accountType.toLowerCase() === 'welper' ? 'welper' : 'customer';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.bookingRepo.createQueryBuilder('b');

    if (role === 'welper') {
      qb.where('b.welper_id = :userId', { userId });
    } else {
      qb.where('b.customer_id = :userId', { userId });
    }

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    if (query.dateFrom) {
      qb.andWhere('b.scheduled_date >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('b.scheduled_date <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('b.created_at', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    const userRole = role as 'customer' | 'welper';
    return {
      data: data.map((b) => this.toResponse(b, userId, userRole)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findAllForAdmin(query: {
    page?: number;
    limit?: number;
    customerId?: string;
    welperId?: string;
    status?: BookingRequestStatus;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<{ data: BookingResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const qb = this.bookingRepo.createQueryBuilder('b');

    if (query.customerId?.trim()) {
      qb.andWhere('b.customer_id = :cid', { cid: query.customerId.trim() });
    }
    if (query.welperId?.trim()) {
      qb.andWhere('b.welper_id = :wid', { wid: query.welperId.trim() });
    }
    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }
    if (query.dateFrom) {
      qb.andWhere('b.scheduled_date >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('b.scheduled_date <= :dateTo', { dateTo: query.dateTo });
    }

    qb.orderBy('b.created_at', 'DESC');
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data: data.map((b) => {
        const dto = this.toResponse(b, b.customerId, 'customer');
        dto.availableActions = [];
        return dto;
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  // ─── Welper Actions ───────────────────────────────────────────────────

  async accept(bookingId: string, welperId: string, accountType: string): Promise<BookingResponseDto> {
    await this.backgroundCheckService.assertCanAcceptBookings(welperId);

    let idempotentAlreadyAccepted: BookingRequest | null = null;

    await this.dataSource.transaction(async (manager) => {
      const bookingRepo = manager.getRepository(BookingRequest);
      const booking = await bookingRepo
        .createQueryBuilder('b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: bookingId })
        .getOne();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.welperId !== welperId) {
        throw new ForbiddenException('You are not authorized to manage this booking');
      }
      if (booking.status === BookingRequestStatus.ACCEPTED) {
        idempotentAlreadyAccepted = booking;
        return;
      }
      validateTransition(booking.status, BookingRequestStatus.ACCEPTED);

      if (booking.scheduledDate && booking.scheduledStartTime && booking.scheduledEndTime) {
        await this.checkConflictsInTransaction(
          { manager },
          welperId,
          booking.scheduledDate,
          booking.scheduledStartTime,
          booking.scheduledEndTime,
          bookingId,
        );
      }
    });

    if (idempotentAlreadyAccepted) {
      return this.toResponse(idempotentAlreadyAccepted, welperId, 'welper');
    }

    await this.paymentService.authorizeHoldBeforeWelperAccept(bookingId);

    let saved: BookingRequest;
    try {
      saved = await this.withTransaction(async (queryRunner) => {
        const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
        const booking = await bookingRepo
          .createQueryBuilder('b')
          .setLock('pessimistic_write')
          .where('b.id = :id', { id: bookingId })
          .getOne();
        if (!booking) {
          throw new NotFoundException('Booking not found');
        }
        if (booking.welperId !== welperId) {
          throw new ForbiddenException('You are not authorized to manage this booking');
        }
        if (booking.status !== BookingRequestStatus.PENDING) {
          throw new BadRequestException(
            'This booking is no longer pending (it may have been cancelled). Payment hold was released if applicable.',
          );
        }
        validateTransition(booking.status, BookingRequestStatus.ACCEPTED);

        booking.status = BookingRequestStatus.ACCEPTED;
        booking.acceptedAt = new Date();

        return bookingRepo.save(booking);
      });
    } catch (e) {
      await this.paymentService.onBookingCanceled(bookingId);
      throw e;
    }

    this.logger.log(`Booking ${bookingId} accepted by welper ${welperId}`);
    const welperName = await this.resolvePersonDisplayName('welper', saved.welperId, 'Your welper');
    await this.notifyBookingEvent(saved, saved.customerId, 'booking_accepted', 'Booking accepted', 'Your booking was accepted.', { welperName });
    return this.toResponse(saved, welperId, 'welper');
  }

  async decline(bookingId: string, welperId: string, reason?: string): Promise<BookingResponseDto> {
    const saved = await this.withTransaction(async (queryRunner) => {
      const booking = await this.getBookingForWelperLocked(queryRunner, bookingId, welperId);
      validateTransition(booking.status, BookingRequestStatus.DECLINED);

      booking.status = BookingRequestStatus.DECLINED;
      booking.declinedAt = new Date();
      booking.declineReason = reason ?? null;

      return queryRunner.manager.getRepository(BookingRequest).save(booking);
    });
    this.logger.log(`Booking ${bookingId} declined by welper ${welperId}`);
    await this.paymentService.onBookingCanceled(saved.id);
    await this.notifyBookingEvent(saved, saved.customerId, 'booking_declined', 'Booking declined', 'Your booking request was declined.', { declineReason: reason ?? undefined });
    return this.toResponse(saved, welperId, 'welper');
  }

  async checkIn(bookingId: string, welperId: string): Promise<BookingResponseDto> {
    const saved = await this.withTransaction(async (queryRunner) => {
      const booking = await this.getBookingForWelperLocked(queryRunner, bookingId, welperId);
      validateTransition(booking.status, BookingRequestStatus.IN_PROGRESS);

      booking.status = BookingRequestStatus.IN_PROGRESS;
      booking.checkedInAt = new Date();

      return queryRunner.manager.getRepository(BookingRequest).save(booking);
    });
    this.logger.log(`Booking ${bookingId} checked in by welper ${welperId}`);
    const welperNameIn = await this.resolvePersonDisplayName('welper', saved.welperId, 'Your welper');
    await this.notifyBookingEvent(saved, saved.customerId, 'booking_checked_in', 'Welper checked in', 'Your welper has checked in.', { welperName: welperNameIn });
    return this.toResponse(saved, welperId, 'welper');
  }

  async checkOut(bookingId: string, welperId: string): Promise<BookingResponseDto> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking || booking.welperId !== welperId) {
      throw new ForbiddenException('You are not authorized to manage this booking');
    }
    if (booking.status !== BookingRequestStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'Check-out is only available when the booking is in progress. Disputed bookings must be resolved by support.',
      );
    }
    const billingCheckInAt = (booking.checkedInAt ?? new Date()).toISOString();
    const billingCheckOutAt = new Date().toISOString();
    const result = await this.submitServiceReceipt(bookingId, welperId, {
      billingCheckInAt,
      billingCheckOutAt,
    });
    return result.booking;
  }

  async getServiceReceiptDraft(
    bookingId: string,
    userId: string,
    accountType: string,
  ): Promise<ServiceReceiptDraftDto> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== userId && booking.welperId !== userId) {
      throw new ForbiddenException('You are not authorized to view this booking');
    }
    const isWelper = accountType.toLowerCase() === 'welper' && booking.welperId === userId;

    const hourly = booking.hourlyRate != null ? Number(booking.hourlyRate) : null;
    if (hourly == null || hourly <= 0) {
      throw new BadRequestException('This booking has no hourly rate for billing');
    }

    const confirmed = await this.serviceReceiptRepo.findOne({ where: { bookingId } });
    const holdCents = await this.paymentService.getAuthorizedHoldCents(bookingId);
    const now = new Date();
    let suggestedIn: Date;
    let suggestedOut: Date;

    if (confirmed) {
      suggestedIn = confirmed.billingCheckInAt;
      suggestedOut = confirmed.billingCheckOutAt;
    } else if (isWelper && booking.status === BookingRequestStatus.IN_PROGRESS) {
      suggestedIn = booking.checkedInAt ?? now;
      suggestedOut = now;
    } else if (!isWelper && confirmed === null) {
      throw new NotFoundException('Service receipt is not available yet');
    } else {
      throw new BadRequestException(
        'Receipt can only be prepared while the booking is in progress',
      );
    }

    const subtotalCents = this.computeReceiptSubtotalCents(suggestedIn, suggestedOut, hourly);
    const taxRateBps = await this.applicationSettings.getBookingTaxRateBps();
    const taxCents = this.computeTaxCents(subtotalCents, taxRateBps);
    const computedTotalCents = subtotalCents + taxCents;

    return {
      bookingId,
      hourlyRate: hourly,
      suggestedBillingCheckInAt: suggestedIn.toISOString(),
      suggestedBillingCheckOutAt: suggestedOut.toISOString(),
      computedTotalCents,
      currency: 'cad',
      authorizedHoldCents: holdCents,
      confirmedReceipt: confirmed ? await this.toServiceReceiptDto(confirmed) : null,
    };
  }

  async submitServiceReceipt(
    bookingId: string,
    welperId: string,
    dto: SubmitServiceReceiptDto,
  ): Promise<ConfirmServiceReceiptResponseDto> {
    const billingCheckInAt = new Date(dto.billingCheckInAt);
    const billingCheckOutAt = new Date(dto.billingCheckOutAt);
    if (Number.isNaN(billingCheckInAt.getTime()) || Number.isNaN(billingCheckOutAt.getTime())) {
      throw new BadRequestException('Invalid billing date values');
    }

    const existingReceipt = await this.serviceReceiptRepo.findOne({ where: { bookingId } });
    if (existingReceipt) {
      const bookingEntity = await this.bookingRepo.findOne({ where: { id: bookingId } });
      if (!bookingEntity) {
        throw new NotFoundException('Booking not found');
      }
      if (bookingEntity.welperId !== welperId) {
        throw new ForbiddenException('You are not authorized to manage this booking');
      }
      const resDto = this.toResponse(bookingEntity, welperId, 'welper');
      await this.attachPaymentAndReceipt(resDto, bookingId);
      return {
        booking: resDto,
        receipt: await this.toServiceReceiptDto(existingReceipt),
      };
    }

    let savedReceipt: BookingServiceReceipt;
    let savedBooking: BookingRequest;
    let totalCents: number;

    const row = await this.withTransaction(async (queryRunner) => {
      const booking = await this.getBookingForWelperLocked(queryRunner, bookingId, welperId);
      if (booking.status !== BookingRequestStatus.IN_PROGRESS) {
        throw new BadRequestException(
          'You can only submit a service receipt while the booking is in progress.',
        );
      }
      const hourlyNum = booking.hourlyRate != null ? Number(booking.hourlyRate) : null;
      if (hourlyNum == null || hourlyNum <= 0) {
        throw new BadRequestException('This booking has no hourly rate for billing');
      }
      this.assertReceiptBillingWindowReasonable(booking, billingCheckInAt, billingCheckOutAt);
      const taxRateBps = await this.applicationSettings.getBookingTaxRateBps();
      const subtotalCents = this.computeReceiptSubtotalCents(billingCheckInAt, billingCheckOutAt, hourlyNum);
      const taxCents = this.computeTaxCents(subtotalCents, taxRateBps);
      const cents = subtotalCents + taxCents;
      validateTransition(booking.status, BookingRequestStatus.COMPLETED);

      const receiptRepo = queryRunner.manager.getRepository(BookingServiceReceipt);
      const receipt = receiptRepo.create({
        bookingId,
        billingCheckInAt,
        billingCheckOutAt,
        hourlyRate: String(hourlyNum),
        subtotalCents,
        taxCents,
        taxRateBps,
        totalCents: cents,
        currency: 'cad',
        notes: dto.notes?.trim() ? dto.notes.trim() : null,
        confirmedAt: new Date(),
        sentToCustomerAt: null,
      });
      const persistedReceipt = await receiptRepo.save(receipt);

      booking.status = BookingRequestStatus.COMPLETED;
      booking.checkedInAt = billingCheckInAt;
      booking.checkedOutAt = billingCheckOutAt;
      booking.completedAt = new Date();
      booking.totalPrice = Math.round(cents) / 100;

      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
      const persistedBooking = await bookingRepo.save(booking);
      return { receipt: persistedReceipt, booking: persistedBooking, totalCents: cents };
    });
    savedReceipt = row.receipt;
    savedBooking = row.booking;
    totalCents = row.totalCents;

    let capture: {
      primaryCapturedCents: number;
      deltaPayment?: { clientSecret: string | null; paymentIntentId: string; requiresAction: boolean };
    };
    try {
      capture = await this.paymentService.captureForServiceReceipt({
        bookingId,
        customerId: savedBooking.customerId,
        welperId: savedBooking.welperId,
        receiptTotalCents: totalCents,
        receiptId: savedReceipt.id,
      });
    } catch (err) {
      this.logger.error(
        `Payment capture failed after receipt persisted for booking ${bookingId}: ${(err as Error).message}`,
      );
      await this.withTransaction(async (queryRunner) => {
        const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
        const receiptRepo = queryRunner.manager.getRepository(BookingServiceReceipt);
        const booking = await bookingRepo
          .createQueryBuilder('b')
          .setLock('pessimistic_write')
          .where('b.id = :id', { id: bookingId })
          .getOne();
        if (booking && booking.status === BookingRequestStatus.COMPLETED) {
          booking.status = BookingRequestStatus.IN_PROGRESS;
          booking.completedAt = null;
          booking.checkedOutAt = null;
          await bookingRepo.save(booking);
        }
        await receiptRepo.delete({ bookingId });
      });
      throw err;
    }

    savedReceipt.sentToCustomerAt = new Date();
    await this.serviceReceiptRepo.save(savedReceipt);

    this.logger.log(`Booking ${bookingId} completed with service receipt by welper ${welperId}`);
    const totalDollars = (totalCents / 100).toFixed(2);
    await this.notifyBookingEvent(
      savedBooking,
      savedBooking.customerId,
      'booking_service_receipt',
      'Service receipt',
      `Your welper sent a service receipt. Amount: $${totalDollars} CAD. Open your booking to review or dispute if something looks wrong.`,
      {
        totalPrice: totalDollars,
        receiptTotalCents: String(totalCents),
      },
    );

    const resDto = this.toResponse(savedBooking, welperId, 'welper');
    await this.attachPaymentAndReceipt(resDto, bookingId);

    return {
      booking: resDto,
      receipt: await this.toServiceReceiptDto(savedReceipt),
      deltaPayment: capture.deltaPayment,
    };
  }

  // ─── Shared Actions ───────────────────────────────────────────────────

  async cancel(
    bookingId: string,
    userId: string,
    accountType: string,
    reason?: string,
    timezoneOffsetMinutes?: number,
  ): Promise<BookingResponseDto> {
    const saved = await this.withTransaction(async (queryRunner) => {
      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
      const booking = await bookingRepo
        .createQueryBuilder('b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: bookingId })
        .getOne();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.customerId !== userId && booking.welperId !== userId) {
        throw new ForbiddenException('You are not authorized to cancel this booking');
      }
      if (booking.status === BookingRequestStatus.DISPUTED) {
        throw new BadRequestException(
          'This booking is under dispute. It cannot be cancelled by participants until support resolves the dispute.',
        );
      }

      validateTransition(booking.status, BookingRequestStatus.CANCELLED);

      const offset = timezoneOffsetMinutes ?? booking.timezoneOffsetMinutes ?? null;
      if (booking.scheduledDate && booking.scheduledStartTime) {
        const scheduledUtcMs = this.scheduledTimeToUtcMs(
          booking.scheduledDate,
          booking.scheduledStartTime,
          offset,
        );
        const hoursUntil = (scheduledUtcMs - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < FREE_CANCELLATION_HOURS) {
          this.logger.warn(
            `Late cancellation for booking ${bookingId} (${hoursUntil.toFixed(1)}h before service)`,
          );
          // MVP: late cancellations are logged only; fees not charged (see architecture docs).
        }
      }

      booking.status = BookingRequestStatus.CANCELLED;
      booking.cancelledBy = userId;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason ?? null;

      return bookingRepo.save(booking);
    });
    const role = accountType.toLowerCase() === 'welper' ? ('welper' as const) : ('customer' as const);
    this.logger.log(`Booking ${bookingId} cancelled by ${role} ${userId}`);
    await this.paymentService.onBookingCanceled(saved.id);
    const paymentSummary = await this.paymentService.getBookingPaymentSummary(saved.id);
    if (paymentSummary?.phase === 'captured') {
      this.logger.warn(
        `Booking ${saved.id} cancelled after card capture; funds were not auto-refunded. Use admin dispute resolution with refund if the customer should be reimbursed.`,
      );
    }
    const notifyUserId = userId === saved.customerId ? saved.welperId : saved.customerId;
    await this.notifyBookingEvent(saved, notifyUserId, 'booking_cancelled', 'Booking cancelled', 'A booking was cancelled.', { cancellationReason: reason ?? undefined });
    return this.toResponse(saved, userId, role);
  }

  // ─── Notifications ─────────────────────────────────────────────────────

  private async notifyBookingEvent(
    booking: BookingRequest,
    userId: string,
    emailType:
      | 'booking_created'
      | 'booking_accepted'
      | 'booking_declined'
      | 'booking_cancelled'
      | 'booking_checked_in'
      | 'booking_completed'
      | 'booking_service_receipt',
    title: string,
    body: string,
    extraVars: Record<string, string | undefined> = {},
    offering?: { serviceDescription?: string; hourlyRate?: number | null },
  ): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    const actionUrl = `${baseUrl}/dashboard/bookings/${booking.id}`;
    let serviceName = offering?.serviceDescription?.slice(0, 80) || 'Service';
    if (!offering && booking.serviceOfferingId) {
      try {
        const off = await this.serviceOfferingService.findById(booking.serviceOfferingId);
        serviceName = off.serviceDescription?.slice(0, 80) || 'Service';
      } catch {
        serviceName = 'Service';
      }
    }
    const addressStr = booking.address && typeof booking.address === 'object'
      ? [booking.address.street, booking.address.city, booking.address.region, booking.address.postalCode].filter(Boolean).join(', ')
      : undefined;
    const variables: Record<string, string | undefined> = {
      serviceName,
      scheduledDate: booking.scheduledDate ?? undefined,
      startTime: booking.scheduledStartTime ? this.normalizeTime(booking.scheduledStartTime) ?? undefined : undefined,
      endTime: booking.scheduledEndTime ? this.normalizeTime(booking.scheduledEndTime) ?? undefined : undefined,
      totalPrice: booking.totalPrice != null ? String(booking.totalPrice) : undefined,
      bookingUrl: actionUrl,
      address: addressStr,
      ...extraVars,
    };
    try {
      await this.notificationService.send({
        userId,
        category: NotificationCategory.BOOKING,
        title,
        body,
        metadata: { bookingId: booking.id, actionUrl },
        bookingEmailType: emailType,
        bookingEmailVariables: variables,
      });
    } catch (err) {
      this.logger.warn(`Failed to send booking notification: ${(err as Error).message}`);
    }
  }

  // ─── Conflict Detection ───────────────────────────────────────────────

  /**
   * Check if the welper has overlapping accepted/in-progress bookings
   * for the given date and time window.
   */
  private async checkConflicts(
    welperId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<void> {
    const count = await this.countConflicts(this.bookingRepo, welperId, date, startTime, endTime, excludeBookingId);
    if (count > 0) {
      throw new BadRequestException(
        'The welper has a scheduling conflict for the requested time slot',
      );
    }
  }

  /** Same as checkConflicts but using a repository from a transaction (e.g. queryRunner.manager). */
  private async checkConflictsInTransaction(
    queryRunner: { manager: { getRepository: (entity: any) => Repository<BookingRequest> } },
    welperId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<void> {
    const repo = queryRunner.manager.getRepository(BookingRequest);
    const count = await this.countConflicts(repo, welperId, date, startTime, endTime, excludeBookingId);
    if (count > 0) {
      throw new BadRequestException(
        'The welper has a scheduling conflict for the requested time slot',
      );
    }
  }

  private async countConflicts(
    repo: Repository<BookingRequest>,
    welperId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeBookingId?: string,
  ): Promise<number> {
    const qb = repo
      .createQueryBuilder('b')
      .where('b.welper_id = :welperId', { welperId })
      .andWhere('b.scheduled_date = :date', { date })
      .andWhere('b.status IN (:...activeStatuses)', {
        activeStatuses: [
          BookingRequestStatus.PENDING,
          BookingRequestStatus.ACCEPTED,
          BookingRequestStatus.IN_PROGRESS,
        ],
      })
      .andWhere('b.scheduled_start_time < :endTime', { endTime })
      .andWhere('b.scheduled_end_time > :startTime', { startTime });

    if (excludeBookingId) {
      qb.andWhere('b.id != :excludeId', { excludeId: excludeBookingId });
    }
    return qb.getCount();
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  /**
   * Convert scheduled date+time to UTC ms. If offset is set (minutes from UTC),
   * the date/time is interpreted in that timezone; otherwise server local.
   */
  private scheduledTimeToUtcMs(dateStr: string, timeStr: string, offsetMinutes: number | null): number {
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = (timeStr.length >= 5 ? timeStr.slice(0, 5) : timeStr).split(':').map(Number);
    if (offsetMinutes != null) {
      return Date.UTC(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0) - (offsetMinutes * 60 * 1000);
    }
    return new Date(y!, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0).getTime();
  }

  /** Fetch a booking with a pessimistic write lock inside a transaction — used by welper state transitions. */
  private async getBookingForWelperLocked(
    queryRunner: { manager: { getRepository: (entity: any) => Repository<BookingRequest> } },
    bookingId: string,
    welperId: string,
  ): Promise<BookingRequest> {
    const repo = queryRunner.manager.getRepository(BookingRequest);
    const booking = await repo
      .createQueryBuilder('b')
      .setLock('pessimistic_write')
      .where('b.id = :id', { id: bookingId })
      .getOne();
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.welperId !== welperId) {
      throw new ForbiddenException('You are not authorized to manage this booking');
    }
    return booking;
  }

  private async resolvePersonDisplayName(
    role: 'customer' | 'welper',
    id: string,
    fallback: string,
  ): Promise<string> {
    try {
      if (role === 'customer') {
        const p = await this.customerProfileService.findByCustomerId(id);
        const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
        if (n) return n;
      } else {
        const p = await this.welperProfileService.findByWelperId(id);
        const n = [p.firstName, p.lastName].filter(Boolean).join(' ').trim();
        if (n) return n;
      }
    } catch {
      /* use fallback chain */
    }
    try {
      const u = await this.usersService.findById(id);
      const local = u.email?.split('@')[0]?.trim();
      if (local) return local;
    } catch {
      /* fallback */
    }
    return fallback;
  }
}
