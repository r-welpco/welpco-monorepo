import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { BookingRequest, BookingRequestStatus } from './entities/booking-request.entity';
import { BookingServiceReceipt } from './entities/booking-service-receipt.entity';
import { CreateBookingRequestDto } from './dto/create-booking-request.dto';
import { BookingListQueryDto } from './dto/booking-list-query.dto';
import { BookingResponseDto } from './dto/booking-response.dto';
import { computeWelperGrossCentsFromCustomerSubtotal } from './booking-pricing';
import { scheduledTimeToUtcMs } from './booking-schedule-time';
import { SubmitServiceReceiptDto } from './dto/submit-service-receipt.dto';
import {
  ConfirmServiceReceiptResponseDto,
  ServiceReceiptDraftDto,
} from './dto/service-receipt.dto';
import { ServiceReceiptDto, ReceiptEvidenceFileDto } from './dto/service-receipt-summary.dto';
import { S3UrlPresignerService } from '../../clients/s3';
import { ServiceOfferingService } from '../profile-management/service-offering/service-offering.service';
import { ServiceQuestionsService } from '../content-management/service-questions/service-questions.service';
import { Question, QuestionType } from '../content-management/entities/question.entity';
import { AvailabilityService } from '../profile-management/availability/availability.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';
import { PaymentService } from '../payment/payment.service';
import { CustomerProfileService } from '../profile-management/customer-profile/customer-profile.service';
import { WelperProfileService } from '../profile-management/welper-profile/welper-profile.service';
import { formatWelperDisplayNameForCustomer } from '../../common/display-name.util';
import { UsersService } from '../user-management/users/users.service';
import { BackgroundCheckService } from '../safety-verification/background-check.service';
import { StripeConnectService } from '../payment/stripe-connect.service';
import { PayoutMethodChoice } from '../profile-management/entities/payout-method-choice.enum';
import { ApplicationSettingsService } from '../payment/application-settings.service';
import { BookingTaxService } from '../payment/booking-tax.service';
import type { BookingTaxContext } from '../payment/booking-tax.types';
import { validateTransition, getValidTransitions } from './booking-state-machine';
import type { ServiceQuestion } from '../content-management/entities/service-question.entity';
import {
  MIN_BOOKING_DURATION_MINUTES,
  RECEIPT_CHECKOUT_FUTURE_GRACE_MINUTES,
  snapReceiptBillingWindow,
  customerHourlyChargeFromWelperRate,
} from './booking-pricing';
import { getDisputeReportDeadlineAt } from './dispute-report-window';
import { customerProfileAddressToBookingRecord } from './booking-address.util';
import { resolveServiceTaxAddress } from '../payment/booking-tax-address.util';
import type { Address } from '../../common/types';
import { getBookingNotificationCopy, type BookingEmailType } from '@welpco/email';
import {
  buildBookingActionUrl,
  getFrontendBaseUrl,
} from '../notification/notification-locale.helper';
import { JobPostingService } from '../job-posting/job-posting.service';

/** Hours before scheduled time when free cancellation is no longer possible */
const FREE_CANCELLATION_HOURS = 24;
const MAX_RECEIPT_BILLING_MINUTES = 720;
const RECEIPT_SCHEDULE_GRACE_BEFORE_MINUTES = 60;
const RECEIPT_SCHEDULE_GRACE_AFTER_MINUTES = 120;
const MAX_BOOKING_ANSWER_KEYS = 100;
const MAX_BOOKING_ANSWER_STRING_LENGTH = 2000;
const MAX_BOOKING_ANSWERS_JSON_LENGTH = 20000;

type BookingAnswerValue = string | number | boolean;

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
    private readonly bookingTaxService: BookingTaxService,
    private readonly customerProfileService: CustomerProfileService,
    private readonly welperProfileService: WelperProfileService,
    private readonly usersService: UsersService,
    private readonly s3Presigner: S3UrlPresignerService,
    private readonly backgroundCheckService: BackgroundCheckService,
    private readonly stripeConnectService: StripeConnectService,
    @Inject(forwardRef(() => JobPostingService))
    private readonly jobPostingService: JobPostingService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────

  /** Home services are always at the customer's profile address. */
  private async resolveCustomerServiceAddress(customerId: string): Promise<Record<string, string>> {
    const profile = await this.customerProfileService.findByCustomerId(customerId);
    const profileAddress = profile?.address as Address | null | undefined;
    if (!profileAddress) {
      throw new BadRequestException(
        'Add a complete home address in Settings before booking.',
      );
    }

    const bookingAddress = customerProfileAddressToBookingRecord(profileAddress);
    if (!resolveServiceTaxAddress(bookingAddress, null)) {
      throw new BadRequestException(
        'Your profile address must include street, city, province, and postal code before booking.',
      );
    }

    return bookingAddress;
  }

  private isServiceQuestionVisible(
    sq: ServiceQuestion,
    answers: Record<string, BookingAnswerValue>,
  ): boolean {
    const cl = sq.conditionalLogic;
    if (!cl?.showIf) return true;
    return answers[cl.showIf.questionId] === cl.showIf.value;
  }

  private isEmptyAnswer(value: BookingAnswerValue | undefined): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim() === '';
    return false;
  }

  private assertAnswersPayloadReasonable(
    answers: Record<string, BookingAnswerValue>,
  ): void {
    if (Object.keys(answers).length > MAX_BOOKING_ANSWER_KEYS) {
      throw new BadRequestException('Too many booking question answers');
    }

    let serializedLength = 0;
    try {
      serializedLength = JSON.stringify(answers).length;
    } catch {
      throw new BadRequestException('Invalid booking question answers');
    }
    if (serializedLength > MAX_BOOKING_ANSWERS_JSON_LENGTH) {
      throw new BadRequestException('Booking question answers are too large');
    }
  }

  private normalizeAnswerValue(
    value: BookingAnswerValue | undefined,
    question?: Question | null,
  ): BookingAnswerValue | undefined {
    if (this.isEmptyAnswer(value)) return undefined;
    if (!question) return value;

    if (question.type === QuestionType.NUMBER) {
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        throw new BadRequestException(`Invalid answer for: ${question.label}`);
      }
      const rules = question.validationRules;
      if (rules?.min !== undefined && value < rules.min) {
        throw new BadRequestException(`Invalid answer for: ${question.label}`);
      }
      if (rules?.max !== undefined && value > rules.max) {
        throw new BadRequestException(`Invalid answer for: ${question.label}`);
      }
      return value;
    }

    if (question.type === QuestionType.BOOLEAN) {
      if (typeof value !== 'boolean') {
        throw new BadRequestException(`Invalid answer for: ${question.label}`);
      }
      return value;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`Invalid answer for: ${question.label}`);
    }

    const stringValue = value.trim();
    if (stringValue.length > MAX_BOOKING_ANSWER_STRING_LENGTH) {
      throw new BadRequestException(`Answer is too long for: ${question.label}`);
    }

    if (question.type === QuestionType.CHOICE) {
      const allowed = question.options?.some((opt) => opt.value === stringValue);
      if (!allowed) {
        throw new BadRequestException(`Invalid answer for: ${question.label}`);
      }
      return stringValue;
    }

    if (question.type === QuestionType.DATE) {
      const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(stringValue);
      if (!match) {
        throw new BadRequestException(`Invalid date answer for: ${question.label}`);
      }
      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);
      const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
      if (month < 1 || month > 12 || day < 1 || day > daysInMonth) {
        throw new BadRequestException(`Invalid date answer for: ${question.label}`);
      }
      return stringValue;
    }

    if (question.type === QuestionType.TIME) {
      if (!/^\d{2}:\d{2}$/.test(stringValue)) {
        throw new BadRequestException(`Invalid time answer for: ${question.label}`);
      }
      const [hoursRaw, minutesRaw] = stringValue.split(':');
      const hours = Number(hoursRaw);
      const minutes = Number(minutesRaw);
      if (hours > 23 || minutes > 59) {
        throw new BadRequestException(`Invalid time answer for: ${question.label}`);
      }
      return stringValue;
    }

    if (question.validationRules?.pattern) {
      try {
        if (!new RegExp(question.validationRules.pattern).test(stringValue)) {
          throw new BadRequestException(`Invalid answer for: ${question.label}`);
        }
      } catch (error) {
        if (error instanceof BadRequestException) throw error;
        // Ignore admin-configured invalid regexes instead of blocking bookings.
      }
    }

    return stringValue;
  }

  private buildValidatedBookingAnswers(
    serviceQuestions: ServiceQuestion[],
    answers: Record<string, BookingAnswerValue>,
  ): Record<string, BookingAnswerValue> {
    this.assertAnswersPayloadReasonable(answers);
    const sanitized: Record<string, BookingAnswerValue> = {};

    for (const sq of serviceQuestions) {
      if (!this.isServiceQuestionVisible(sq, answers)) continue;

      const label = sq.question?.label ?? sq.questionId;
      const normalized = this.normalizeAnswerValue(answers[sq.questionId], sq.question);

      if (normalized === undefined) {
        if (sq.isRequired) {
          throw new BadRequestException(`Missing required answer for: ${label}`);
        }
        continue;
      }

      sanitized[sq.questionId] = normalized;
    }

    return sanitized;
  }

  /** Public wrapper for marketplace job posting question validation. */
  async validateServiceQuestionAnswers(
    serviceQuestionCategoryId: string,
    answers: Record<string, BookingAnswerValue>,
  ): Promise<Record<string, BookingAnswerValue>> {
    const serviceQuestions = await this.serviceQuestionsService.findByServiceCategory(
      serviceQuestionCategoryId,
    );
    return this.buildValidatedBookingAnswers(serviceQuestions, answers);
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
      paymentAuthorizationStatus: booking.paymentAuthorizationStatus,
      paymentAuthorizationDueAt: booking.paymentAuthorizationDueAt?.toISOString() ?? null,
      paymentAuthorizationDeadlineAt: booking.paymentAuthorizationDeadlineAt?.toISOString() ?? null,
      paymentAuthorizationLastAttemptAt: booking.paymentAuthorizationLastAttemptAt?.toISOString() ?? null,
      paymentAuthorizationAttemptCount: booking.paymentAuthorizationAttemptCount,
      paymentAuthorizationFailureCode: booking.paymentAuthorizationFailureCode,
      paymentAuthorizationFailureMessage: booking.paymentAuthorizationFailureMessage,
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
        const welperPendingRequest =
          userRole === 'welper' &&
          booking.welperId === userId &&
          booking.status === BookingRequestStatus.PENDING;
        if (!welperPendingRequest) {
          actions.push('cancel');
        }
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
    if (durationMinutes < MIN_BOOKING_DURATION_MINUTES) {
      throw new BadRequestException(
        `Billing duration must be at least ${MIN_BOOKING_DURATION_MINUTES / 60} hour`,
      );
    }
    if (durationMinutes > MAX_RECEIPT_BILLING_MINUTES) {
      throw new BadRequestException(
        `Billing duration cannot exceed ${MAX_RECEIPT_BILLING_MINUTES / 60} hours`,
      );
    }

    const futureGraceMs = RECEIPT_CHECKOUT_FUTURE_GRACE_MINUTES * 60 * 1000;
    if (checkOut.getTime() > Date.now() + futureGraceMs) {
      throw new BadRequestException(
        'Billing check-out cannot be more than 1 hour in the future',
      );
    }

    if (booking.scheduledDate && booking.scheduledStartTime && booking.scheduledEndTime) {
      const offset = booking.timezoneOffsetMinutes ?? null;
      const scheduledStartMs = scheduledTimeToUtcMs(
        booking.scheduledDate,
        booking.scheduledStartTime,
        offset,
      );
      const scheduledEndMs = scheduledTimeToUtcMs(
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
      stripeTaxTransactionId: r.stripeTaxTransactionId,
      stripeTaxTransactionStatus: r.stripeTaxTransactionStatus,
      stripeTaxTransactionError: r.stripeTaxTransactionError,
      evidenceFiles,
    };
  }

  private async attachCustomerDisplayInfo(dto: BookingResponseDto): Promise<void> {
    const info = await this.customerProfileService.findDisplayInfoByCustomerId(dto.customerId);
    dto.customerFirstName = info?.displayName ?? null;
    dto.customerPhotoUrl = info?.photoUrl ?? null;
  }

  private async attachCustomerDisplayInfoForList(
    dtos: BookingResponseDto[],
    role: 'customer' | 'welper',
  ): Promise<void> {
    if (role !== 'welper' || dtos.length === 0) return;
    const displayByCustomerId = await this.customerProfileService.findDisplayInfoByCustomerIds(
      dtos.map((d) => d.customerId),
    );
    for (const dto of dtos) {
      const info = displayByCustomerId.get(dto.customerId);
      dto.customerFirstName = info?.displayName ?? null;
      dto.customerPhotoUrl = info?.photoUrl ?? null;
    }
  }

  private async attachPaymentAndReceipt(dto: BookingResponseDto, bookingId: string): Promise<void> {
    const pay = await this.paymentService.getBookingPaymentSummary(bookingId);
    if (pay) {
      dto.paymentPhase = pay.phase;
      dto.captureEligibleAt = pay.captureEligibleAt;
    }
    const receipt = await this.serviceReceiptRepo.findOne({ where: { bookingId } });
    dto.serviceReceipt = receipt ? await this.toServiceReceiptDto(receipt) : null;
    if (
      receipt &&
      (dto.status === BookingRequestStatus.COMPLETED ||
        dto.status === BookingRequestStatus.PAYMENT_RELEASED)
    ) {
      dto.welperEarningsCents = computeWelperGrossCentsFromCustomerSubtotal(receipt.subtotalCents);
    } else {
      dto.welperEarningsCents = null;
    }
  }

  private async attachDisputeReportWindow(
    dto: BookingResponseDto,
    booking: BookingRequest,
  ): Promise<void> {
    const windowMinutes = await this.applicationSettings.getDisputeReportWindowMinutes();
    const deadline = getDisputeReportDeadlineAt(booking, windowMinutes);
    dto.disputeReportDeadlineAt = deadline?.toISOString() ?? null;
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

    const hasJobLinkage = !!(dto.jobPostingId && dto.jobApplicationId);
    if ((dto.jobPostingId && !dto.jobApplicationId) || (!dto.jobPostingId && dto.jobApplicationId)) {
      throw new BadRequestException('jobPostingId and jobApplicationId must both be provided');
    }

    await this.paymentService.assertCustomerHasDefaultPaymentMethod(customerId);

    const serviceAddress = await this.resolveCustomerServiceAddress(customerId);

    // Validate service question answers
    const answers = dto.answers ?? {};
    const allowedQuestionCategoryIds = new Set([
      offering.serviceCategoryId,
      ...(Array.isArray(offering.subcategoryIds) ? offering.subcategoryIds : []),
    ]);
    const serviceQuestionCategoryId =
      dto.serviceQuestionCategoryId ?? offering.serviceCategoryId;
    if (!allowedQuestionCategoryIds.has(serviceQuestionCategoryId)) {
      throw new BadRequestException('Question category does not belong to this offering');
    }
    const serviceQuestions = await this.serviceQuestionsService.findByServiceCategory(
      serviceQuestionCategoryId,
    );
    const validatedAnswers = this.buildValidatedBookingAnswers(serviceQuestions, answers);

    // Calculate pricing
    let hourlyRate: number | null = null;
    let totalPrice: number | null = null;
    if (offering.hourlyRate) {
      hourlyRate = customerHourlyChargeFromWelperRate(Number(offering.hourlyRate));
      if (dto.durationMinutes) {
        const pricingPreview: BookingTaxContext = {
          id: 'pricing-preview',
          customerId,
          hourlyRate: String(hourlyRate),
          address: serviceAddress,
        };
        const { totalDollars } = await this.bookingTaxService.quoteScheduledJobTotal(
          pricingPreview,
          dto.durationMinutes,
        );
        totalPrice = totalDollars;
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
        answers: validatedAnswers,
        status: BookingRequestStatus.PENDING,
        scheduledDate: dto.scheduledDate,
        scheduledStartTime: dto.scheduledStartTime,
        scheduledEndTime: dto.scheduledEndTime,
        durationMinutes: dto.durationMinutes,
        timezoneOffsetMinutes: dto.timezoneOffsetMinutes ?? null,
        hourlyRate,
        totalPrice,
        address: serviceAddress,
        notes: dto.notes ?? null,
      });

      const savedBooking = await bookingRepo.save(request);

      if (hasJobLinkage && dto.jobPostingId && dto.jobApplicationId) {
        await this.jobPostingService.linkBookingFromMarketplace(queryRunner.manager, {
          customerId,
          jobPostingId: dto.jobPostingId,
          jobApplicationId: dto.jobApplicationId,
          bookingId: savedBooking.id,
          welperId: dto.welperId,
          offeringId: dto.offeringId,
        });
      }

      return savedBooking;
    });

    if (hasJobLinkage && dto.jobPostingId && dto.jobApplicationId) {
      await this.jobPostingService.notifyAfterBookingLinked({
        jobPostingId: dto.jobPostingId,
        jobApplicationId: dto.jobApplicationId,
        bookingId: saved.id,
        customerId,
        welperId: dto.welperId,
      });
    }

    this.logger.log(`Booking ${saved.id} created by customer ${customerId} for welper ${dto.welperId}`);
    const customerName = await this.resolvePersonDisplayName('customer', customerId, 'A customer');
    await this.notifyBookingEvent(
      saved,
      dto.welperId,
      'booking_created',
      { customerName },
      offering,
      'booking_created',
    );
    // Customer confirmation: their request went out, no charge until the job is done.
    const welperName = await this.resolvePersonDisplayName('welper', dto.welperId, 'your welper');
    await this.notifyBookingEvent(
      saved,
      customerId,
      'booking_request_sent',
      { welperName },
      offering,
      'booking_request_sent',
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
    await this.attachCustomerDisplayInfo(dto);
    await this.attachPaymentAndReceipt(dto, bookingId);
    await this.attachDisputeReportWindow(dto, booking);
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
    const dtos = data.map((b) => this.toResponse(b, userId, userRole));
    await this.attachCustomerDisplayInfoForList(dtos, userRole);
    return {
      data: dtos,
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
    const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? query.page! : 1;
    const limit =
      Number.isFinite(query.limit) && (query.limit ?? 0) > 0
        ? Math.min(query.limit!, 100)
        : 20;
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

  async cancelByAdmin(
    bookingId: string,
    adminUserId: string,
    reason?: string,
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
      if (booking.status === BookingRequestStatus.DISPUTED) {
        throw new BadRequestException(
          'Resolve the dispute instead of cancelling the booking directly.',
        );
      }
      if (
        ![
          BookingRequestStatus.PENDING,
          BookingRequestStatus.ACCEPTED,
          BookingRequestStatus.IN_PROGRESS,
        ].includes(booking.status)
      ) {
        throw new BadRequestException(
          `Cannot admin-cancel a booking in "${booking.status}" status`,
        );
      }

      booking.status = BookingRequestStatus.CANCELLED;
      booking.cancelledBy = adminUserId;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason?.trim() || 'Cancelled by support';

      return bookingRepo.save(booking);
    });

    await this.paymentService.onBookingCanceled(saved.id);
    await Promise.all([
      this.notifyBookingEvent(saved, saved.customerId, 'booking_cancelled', {
        cancellationReason: saved.cancellationReason ?? undefined,
      }, undefined, 'booking_cancelled'),
      this.notifyBookingEvent(saved, saved.welperId, 'booking_cancelled', {
        cancellationReason: saved.cancellationReason ?? undefined,
      }, undefined, 'booking_cancelled'),
    ]);

    const dto = this.toResponse(saved, saved.customerId, 'customer');
    dto.availableActions = [];
    await this.attachPaymentAndReceipt(dto, saved.id);
    await this.attachDisputeReportWindow(dto, saved);
    return dto;
  }

  // ─── Welper Actions ───────────────────────────────────────────────────

  /**
   * Adoption report item 13 / risk D3 — a welper must have somewhere for the
   * money to go before they can accept a paid booking. Discovery stays open
   * without a payout account; only the PENDING→ACCEPTED transition (which
   * places the customer's payment hold) is gated.
   *
   * Mirrors the signup orchestrator's welperPayout completion check: the
   * cheap DB flag (`payoutMethodChoice === STRIPE`, only ever persisted after
   * verified Stripe Connect onboarding) short-circuits first, with the live
   * StripeConnectService.isOnboardingComplete() lookup as the freshness
   * fallback for welpers who just finished onboarding.
   */
  private async assertPayoutAccountReady(welperId: string): Promise<void> {
    const profile = await this.welperProfileService
      .findByWelperId(welperId)
      .catch(() => null);
    const payoutReady =
      profile?.payoutMethodChoice === PayoutMethodChoice.STRIPE ||
      (await this.stripeConnectService.isOnboardingComplete(welperId).catch(() => false));
    if (!payoutReady) {
      throw new BadRequestException({
        code: 'PAYOUT_ACCOUNT_REQUIRED',
        message: 'Connect your payout account to accept bookings.',
      });
    }
  }

  async accept(bookingId: string, welperId: string, accountType: string): Promise<BookingResponseDto> {
    await this.backgroundCheckService.assertCanAcceptBookings(welperId);
    await this.assertPayoutAccountReady(welperId);

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

    await this.paymentService.prepareAuthorizationForAcceptance(bookingId);

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
    await this.notifyBookingEvent(saved, saved.customerId, 'booking_accepted', { welperName }, undefined, 'booking_accepted');
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
    await this.notifyBookingEvent(saved, saved.customerId, 'booking_declined', { declineReason: reason ?? undefined }, undefined, 'booking_declined');
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
    await this.notifyBookingEvent(saved, saved.customerId, 'booking_checked_in', { welperName: welperNameIn }, undefined, 'booking_checked_in');
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

    const snapped = snapReceiptBillingWindow(suggestedIn, suggestedOut);
    suggestedIn = snapped.checkIn;
    suggestedOut = snapped.checkOut;

    const subtotalCents = this.computeReceiptSubtotalCents(suggestedIn, suggestedOut, hourly);
    const taxQuote = await this.bookingTaxService.quoteServiceReceipt(
      booking,
      subtotalCents,
      `draft-${bookingId}`,
    );
    const computedTotalCents = taxQuote.totalCents;

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
    const billingCheckInAtRaw = new Date(dto.billingCheckInAt);
    const billingCheckOutAtRaw = new Date(dto.billingCheckOutAt);
    if (
      Number.isNaN(billingCheckInAtRaw.getTime()) ||
      Number.isNaN(billingCheckOutAtRaw.getTime())
    ) {
      throw new BadRequestException('Invalid billing date values');
    }

    const { checkIn: billingCheckInAt, checkOut: billingCheckOutAt } = snapReceiptBillingWindow(
      billingCheckInAtRaw,
      billingCheckOutAtRaw,
    );

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

    const bookingForTax = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!bookingForTax) {
      throw new NotFoundException('Booking not found');
    }
    if (bookingForTax.welperId !== welperId) {
      throw new ForbiddenException('You are not authorized to manage this booking');
    }
    if (bookingForTax.status !== BookingRequestStatus.IN_PROGRESS) {
      throw new BadRequestException(
        'You can only submit a service receipt while the booking is in progress.',
      );
    }
    const hourlyForTax = bookingForTax.hourlyRate != null ? Number(bookingForTax.hourlyRate) : null;
    if (hourlyForTax == null || hourlyForTax <= 0) {
      throw new BadRequestException('This booking has no hourly rate for billing');
    }
    this.assertReceiptBillingWindowReasonable(bookingForTax, billingCheckInAt, billingCheckOutAt);
    const receiptSubtotalCents = this.computeReceiptSubtotalCents(
      billingCheckInAt,
      billingCheckOutAt,
      hourlyForTax,
    );
    const taxQuote = await this.bookingTaxService.quoteServiceReceipt(
      bookingForTax,
      receiptSubtotalCents,
      `receipt-${bookingId}`,
    );

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
      validateTransition(booking.status, BookingRequestStatus.COMPLETED);

      const receiptRepo = queryRunner.manager.getRepository(BookingServiceReceipt);
      const receipt = receiptRepo.create({
        bookingId,
        billingCheckInAt,
        billingCheckOutAt,
        hourlyRate: String(hourlyNum),
        subtotalCents: taxQuote.subtotalCents,
        taxCents: taxQuote.taxCents,
        taxRateBps: taxQuote.taxRateBps,
        totalCents: taxQuote.totalCents,
        stripeTaxCalculationId: taxQuote.stripeTaxCalculationId || null,
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
      booking.totalPrice = Math.round(taxQuote.totalCents) / 100;

      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
      const persistedBooking = await bookingRepo.save(booking);
      return { receipt: persistedReceipt, booking: persistedBooking, totalCents: taxQuote.totalCents };
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
      await this.notificationService.emitForUser(bookingForTax.customerId, {
        category: NotificationCategory.PAYMENT,
        paymentEmailType: 'payment_failed',
        paymentEmailVariables: {
          failureReason: err instanceof Error ? err.message : String(err),
        },
        metadata: {
          bookingId,
          kind: 'receipt_capture_failed',
        },
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
      {
        totalPrice: totalDollars,
        receiptTotalCents: String(totalCents),
      },
      undefined,
      'booking_service_receipt',
    );
    await this.notifyBookingEvent(
      savedBooking,
      savedBooking.welperId,
      'booking_service_submitted',
      { totalPrice: totalDollars },
      undefined,
      'booking_service_submitted',
    );

    const resDto = this.toResponse(savedBooking, welperId, 'welper');
    await this.attachPaymentAndReceipt(resDto, bookingId);
    await this.attachDisputeReportWindow(resDto, savedBooking);

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
      const role = accountType.toLowerCase() === 'welper' ? ('welper' as const) : ('customer' as const);
      if (role === 'welper' && booking.status === BookingRequestStatus.PENDING) {
        throw new BadRequestException(
          'Pending booking requests must be declined by the welper, not cancelled.',
        );
      }
      if (booking.status === BookingRequestStatus.DISPUTED) {
        throw new BadRequestException(
          'This booking is under dispute. It cannot be cancelled by participants until support resolves the dispute.',
        );
      }

      validateTransition(booking.status, BookingRequestStatus.CANCELLED);

      const offset = timezoneOffsetMinutes ?? booking.timezoneOffsetMinutes ?? null;
      let chargeLateCancellationFee = false;
      if (role === 'customer' && booking.scheduledDate && booking.scheduledStartTime) {
        const scheduledUtcMs = scheduledTimeToUtcMs(
          booking.scheduledDate,
          booking.scheduledStartTime,
          offset,
        );
        const hoursUntil = (scheduledUtcMs - Date.now()) / (1000 * 60 * 60);
        if (hoursUntil < FREE_CANCELLATION_HOURS && hoursUntil >= 0) {
          chargeLateCancellationFee = true;
          this.logger.warn(
            `Late cancellation for booking ${bookingId} (${hoursUntil.toFixed(1)}h before service) — one-hour fee applies`,
          );
        }
      }

      booking.status = BookingRequestStatus.CANCELLED;
      booking.cancelledBy = userId;
      booking.cancelledAt = new Date();
      booking.cancellationReason = reason ?? null;

      return { booking: await bookingRepo.save(booking), chargeLateCancellationFee };
    });
    const role = accountType.toLowerCase() === 'welper' ? ('welper' as const) : ('customer' as const);
    this.logger.log(`Booking ${bookingId} cancelled by ${role} ${userId}`);
    await this.paymentService.onBookingCanceled(saved.booking.id, {
      chargeLateCancellationFee: saved.chargeLateCancellationFee,
    });
    const savedBooking = saved.booking;
    const paymentSummary = await this.paymentService.getBookingPaymentSummary(savedBooking.id);
    if (paymentSummary?.phase === 'captured' && !saved.chargeLateCancellationFee) {
      this.logger.warn(
        `Booking ${savedBooking.id} cancelled after card capture; funds were not auto-refunded. Use admin dispute resolution with refund if the customer should be reimbursed.`,
      );
    }
    const notifyUserId = userId === savedBooking.customerId ? savedBooking.welperId : savedBooking.customerId;
    await this.notifyBookingEvent(
      savedBooking,
      notifyUserId,
      'booking_cancelled',
      { cancellationReason: reason ?? undefined },
      undefined,
      'booking_cancelled',
    );
    return this.toResponse(savedBooking, userId, role);
  }

  // ─── Notifications ─────────────────────────────────────────────────────

  private async notifyBookingEvent(
    booking: BookingRequest,
    userId: string,
    emailType: BookingEmailType,
    extraVars: Record<string, string | undefined> = {},
    offering?: { serviceDescription?: string; hourlyRate?: number | null },
    kind?: string,
  ): Promise<void> {
    const locale = await this.notificationService.resolveLocaleForUser(userId);
    const baseUrl = getFrontendBaseUrl();
    const actionUrl = buildBookingActionUrl(baseUrl, booking.id, locale);
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
    const copy = getBookingNotificationCopy(emailType, locale, variables);
    try {
      await this.notificationService.send({
        userId,
        category: NotificationCategory.BOOKING,
        title: copy.title,
        body: copy.body,
        metadata: { bookingId: booking.id, actionUrl, kind: kind ?? emailType },
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
        return formatWelperDisplayNameForCustomer(p.firstName, p.lastName, fallback);
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
