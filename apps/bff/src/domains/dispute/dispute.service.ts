import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Dispute } from './entities/dispute.entity';
import { Resolution } from './entities/resolution.entity';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { validateTransition } from '../booking/booking-state-machine';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import {
  DisputeEvidencePresignRequestDto,
  DisputeEvidencePresignResponseDto,
} from './dto/dispute-evidence-presign.dto';
import { DisputeResponseDto, DisputeStatusApi } from './dto/dispute-response.dto';
import { CreateResolutionDto } from './dto/create-resolution.dto';
import { DisputeParticipantSummaryDto } from './dto/dispute-participant-summary.dto';
import { DisputeResolutionSummaryDto } from './dto/dispute-resolution-summary.dto';
import { PaymentService, type RefundCapturedResult } from '../payment/payment.service';
import { majorCurrencyUnitsToCents } from '../payment/money';
import { AdminAuditService } from '../user-management/admin/admin-audit.service';
import { S3UrlPresignerService } from '../../clients/s3';
import { UserAccount } from '../user-management/entities/user-account.entity';
import { CustomerProfile } from '../profile-management/entities/customer-profile.entity';
import { WelperProfile } from '../profile-management/entities/welper-profile.entity';
import type { PhoneNumber } from '../../common/types';
import { NotificationService } from '../notification/notification.service';
import { NotificationCategory } from '../notification/entities';

const OPEN_STATUSES: string[] = ['open', 'in_review', 'escalated'];
const RESOLVABLE_STATUSES: string[] = ['open', 'in_review'];
const EVIDENCE_KEY_PREFIX = 'disputes/';
const EVIDENCE_ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'pdf']);
/**
 * Wave 2 (BFF): a dispute can be withdrawn by its filer only while it sits in
 * one of these statuses. Once admin starts work (`escalated`) or finalises
 * (`resolved` / `closed`), the participant loses the unilateral exit.
 *
 * Bible §22.6: this is a safety contract — the filer cannot retroactively
 * delete an investigation that staff have already touched.
 */
const WITHDRAWABLE_STATUSES: string[] = ['open', 'in_review'];

export type StripeRefundOutcome = {
  status: 'succeeded' | 'failed' | 'skipped' | 'not_applicable';
  refundsCreated?: number;
  message?: string;
};

@Injectable()
export class DisputeService {
  private readonly logger = new Logger(DisputeService.name);

  constructor(
    @InjectRepository(Dispute)
    private readonly disputeRepo: Repository<Dispute>,
    @InjectRepository(Resolution)
    private readonly resolutionRepo: Repository<Resolution>,
    @InjectRepository(BookingRequest)
    private readonly bookingRepo: Repository<BookingRequest>,
    @InjectRepository(UserAccount)
    private readonly userAccountRepo: Repository<UserAccount>,
    @InjectRepository(CustomerProfile)
    private readonly customerProfileRepo: Repository<CustomerProfile>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    private readonly dataSource: DataSource,
    private readonly paymentService: PaymentService,
    private readonly adminAuditService: AdminAuditService,
    private readonly s3Presigner: S3UrlPresignerService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * NOTIFICATIONS-001 (Day 16 dispatch 2): build the dispute deep-link the
   * `<NotificationCard>` will route to on click. Booking-domain template
   * shape: `${FRONTEND_URL}/dashboard/<surface>/<id>`.
   */
  private disputeLink(disputeId: string): string {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
    return `${baseUrl}/dashboard/disputes/${disputeId}`;
  }

  /**
   * Emit a notification per recipient. Failures are caught — a notification
   * miss must not roll back a finalised dispute write. Unknown recipients
   * (defensive: empty array, dup ids) are filtered first.
   */
  private async emitDisputeNotifications(
    recipientIds: ReadonlyArray<string | null | undefined>,
    title: string,
    body: string,
    metadata: { disputeId: string; bookingId: string; status: string },
  ): Promise<void> {
    const seen = new Set<string>();
    const link = this.disputeLink(metadata.disputeId);
    for (const id of recipientIds) {
      if (!id || seen.has(id)) continue;
      seen.add(id);
      try {
        await this.notificationService.emitForUser(id, {
          category: NotificationCategory.DISPUTE,
          title,
          body,
          link,
          metadata,
        });
      } catch (err) {
        this.logger.warn(
          `Failed to emit dispute notification for ${id} (${metadata.status}): ${(err as Error).message}`,
        );
      }
    }
  }

  /** Map DB status to API status (in_review -> in-review) */
  private toStatusApi(status: string): DisputeStatusApi {
    if (status === 'in_review') return 'in-review';
    return status as DisputeStatusApi;
  }

  /**
   * Wave 2: presigns the `key` on each `file`-typed evidence item. `message`
   * items pass through unchanged. Returns the dto-friendly shape.
   *
   * Signing failures fall through as `signedUrl: null` (logged inside the
   * presigner) so a transient AWS hiccup doesn't take down the whole dispute
   * read.
   */
  private async signEvidence(
    evidence: Dispute['evidence'],
  ): Promise<DisputeResponseDto['evidence']> {
    if (!evidence || !Array.isArray(evidence) || evidence.length === 0) {
      return evidence ?? undefined;
    }
    return Promise.all(
      evidence.map(async (item) => {
        const base: { type: string; key?: string; id?: string; signedUrl?: string | null } = {
          type: item.type,
        };
        if (item.key !== undefined) base.key = item.key;
        if (item.id !== undefined) base.id = item.id;
        if (
          item.type === 'file' &&
          typeof item.key === 'string' &&
          item.key.startsWith(EVIDENCE_KEY_PREFIX) &&
          item.key.length > 0
        ) {
          base.signedUrl = await this.s3Presigner.presignGet(item.key);
        }
        return base;
      }),
    );
  }

  private async toDto(
    d: Dispute,
    opts?: {
      booking?: BookingRequest | null;
      includeStaffFlags?: boolean;
    },
  ): Promise<DisputeResponseDto> {
    const evidence = await this.signEvidence(d.evidence);
    const dto: DisputeResponseDto = {
      id: d.id,
      bookingId: d.bookingId,
      filerId: d.filerId,
      filerType: d.filerType,
      category: d.category,
      subject: d.subject,
      description: d.description ?? undefined,
      status: this.toStatusApi(d.status),
      evidence,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
    };

    const booking = opts?.booking;
    if (opts?.includeStaffFlags && booking) {
      dto.bookingStatus = booking.status;
      dto.bookingCancelledWithOpenDispute =
        booking.status === BookingRequestStatus.CANCELLED && OPEN_STATUSES.includes(d.status);
    }

    return dto;
  }

  private formatPhoneDisplay(phone: PhoneNumber | null | undefined): string | undefined {
    if (!phone) return undefined;
    if (phone.formatted?.trim()) return phone.formatted.trim();
    const parts = [phone.countryCode ? `+${phone.countryCode}` : '', phone.number?.trim() ?? ''].filter(
      (p) => p.length > 0,
    );
    return parts.length > 0 ? parts.join(' ') : undefined;
  }

  private async buildParticipantSummary(
    userId: string,
    role: 'customer' | 'welper',
  ): Promise<DisputeParticipantSummaryDto> {
    const summary: DisputeParticipantSummaryDto = { userId, role };
    const account = await this.userAccountRepo.findOne({ where: { id: userId } });
    if (account?.email) summary.email = account.email;

    if (role === 'customer') {
      const profile = await this.customerProfileRepo.findOne({ where: { customerId: userId } });
      if (profile) {
        if (profile.firstName) summary.firstName = profile.firstName;
        if (profile.lastName) summary.lastName = profile.lastName;
        const phone = this.formatPhoneDisplay(profile.phoneNumber ?? undefined);
        if (phone) summary.phoneDisplay = phone;
      }
    } else {
      const profile = await this.welperProfileRepo.findOne({ where: { welperId: userId } });
      if (profile) {
        if (profile.firstName) summary.firstName = profile.firstName;
        if (profile.lastName) summary.lastName = profile.lastName;
        const phone = this.formatPhoneDisplay(profile.phoneNumber ?? undefined);
        if (phone) summary.phoneDisplay = phone;
      }
    }
    return summary;
  }

  private assertEvidenceBelongsToFiler(
    userId: string,
    evidence: CreateDisputeDto['evidence'],
  ): void {
    if (!evidence) return;
    const ownedPrefix = `${EVIDENCE_KEY_PREFIX}${userId}/`;

    for (const item of evidence) {
      if (item.type === 'file') {
        if (!item.key?.trim()) {
          throw new BadRequestException('File evidence must include an uploaded evidence key');
        }
        const key = item.key.trim();
        if (!key.startsWith(ownedPrefix) || key.includes('..')) {
          throw new BadRequestException('Evidence file key does not belong to the current user');
        }
        const ext = key.split('.').pop()?.toLowerCase();
        if (!ext || !EVIDENCE_ALLOWED_EXTENSIONS.has(ext)) {
          throw new BadRequestException('Evidence file type is not allowed');
        }
      }

      if (item.type === 'message' && !item.id?.trim()) {
        throw new BadRequestException('Message evidence must include a message id');
      }
    }
  }

  private resolutionToSummary(r: Resolution): DisputeResolutionSummaryDto {
    return {
      id: r.id,
      resolutionType: r.resolutionType,
      notes: r.notes ?? null,
      refundAmount: r.refundAmount != null ? Number(r.refundAmount) : null,
      resolvedAt: r.resolvedAt!.toISOString(),
      resolvedById: r.resolvedById ?? null,
    };
  }

  async create(
    bookingId: string,
    userId: string,
    accountType: string,
    dto: CreateDisputeDto,
  ): Promise<DisputeResponseDto> {
    const filerType = accountType.toLowerCase() === 'welper' ? 'welper' : 'customer';
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);
      const disputeRepo = queryRunner.manager.getRepository(Dispute);

      const booking = await bookingRepo
        .createQueryBuilder('b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: bookingId })
        .getOne();
      if (!booking) {
        throw new NotFoundException('Booking not found');
      }
      if (booking.customerId !== userId && booking.welperId !== userId) {
        throw new ForbiddenException('You are not authorized to file a dispute for this booking');
      }
      validateTransition(booking.status, BookingRequestStatus.DISPUTED);

      const existingOpen = await disputeRepo
        .createQueryBuilder('d')
        .where('d.booking_id = :bookingId', { bookingId })
        .andWhere('d.status IN (:...statuses)', { statuses: OPEN_STATUSES })
        .getOne();
      if (existingOpen) {
        throw new ConflictException('This booking already has an open dispute');
      }
      this.assertEvidenceBelongsToFiler(userId, dto.evidence);

      const dispute = disputeRepo.create({
        bookingId,
        filerId: userId,
        filerType,
        category: dto.category,
        subject: dto.subject,
        description: dto.description ?? null,
        status: 'open',
        evidence: dto.evidence ?? null,
      });
      const savedDispute = await disputeRepo.save(dispute);

      booking.status = BookingRequestStatus.DISPUTED;
      await bookingRepo.save(booking);

      await queryRunner.commitTransaction();

      // NOTIFICATIONS-001: notify the OTHER party that a problem report was
      // filed. Filer already knows; we don't ping them. Body keeps the
      // dispute subject in plain language so the recipient can triage from
      // the bell without opening the page.
      const counterpartyId =
        booking.customerId === userId ? booking.welperId : booking.customerId;
      await this.emitDisputeNotifications(
        [counterpartyId],
        'New problem report',
        `A problem report was filed about a recent booking: "${dto.subject}". Open it to see details and respond.`,
        { disputeId: savedDispute.id, bookingId: savedDispute.bookingId, status: 'open' },
      );

      return await this.toDto(savedDispute);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  async findByBooking(bookingId: string, userId: string): Promise<DisputeResponseDto | null> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) {
      throw new NotFoundException('Booking not found');
    }
    if (booking.customerId !== userId && booking.welperId !== userId) {
      throw new ForbiddenException('You are not authorized to view this booking');
    }
    const dispute = await this.disputeRepo.findOne({
      where: { bookingId },
      order: { createdAt: 'DESC' },
    });
    return dispute ? await this.toDto(dispute) : null;
  }

  async findMine(
    userId: string,
    accountType: string,
    page = 1,
    limit = 20,
    /** DB dispute status (e.g. in_review). Only applied for admin list when provided. */
    statusDb?: string,
  ): Promise<{ data: DisputeResponseDto[]; total: number; page: number; limit: number; totalPages: number }> {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const qb = this.disputeRepo
      .createQueryBuilder('d')
      .orderBy('d.created_at', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (accountType.toLowerCase() === 'admin' && statusDb) {
      qb.andWhere('d.status = :disputeStatus', { disputeStatus: statusDb });
    }

    if (accountType.toLowerCase() !== 'admin') {
      qb
        .innerJoin(BookingRequest, 'b', 'b.id = d.booking_id')
        .where('(b.customer_id = :userId OR b.welper_id = :userId)', { userId });
    }

    const [disputes, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit) || 1;

    const isAdmin = accountType.toLowerCase() === 'admin';
    let bookingById = new Map<string, BookingRequest>();
    if (isAdmin && disputes.length > 0) {
      const ids = [...new Set(disputes.map((d) => d.bookingId))];
      const bookings = await this.bookingRepo.find({ where: { id: In(ids) } });
      bookingById = new Map(bookings.map((b) => [b.id, b]));
    }

    const data = await Promise.all(
      disputes.map((d) =>
        this.toDto(d, {
          booking: bookingById.get(d.bookingId),
          includeStaffFlags: isAdmin,
        }),
      ),
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findById(
    disputeId: string,
    userId: string,
    accountType?: string,
  ): Promise<DisputeResponseDto> {
    const dispute = await this.disputeRepo.findOne({
      where: { id: disputeId },
      relations: [],
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    const booking = await this.bookingRepo.findOne({ where: { id: dispute.bookingId } });
    if (accountType?.toLowerCase() === 'admin') {
      const dto = await this.toDto(dispute, { booking, includeStaffFlags: true });
      if (booking) {
        const [customer, welper, resolutionRow, captured] = await Promise.all([
          this.buildParticipantSummary(booking.customerId, 'customer'),
          this.buildParticipantSummary(booking.welperId, 'welper'),
          this.resolutionRepo.findOne({ where: { disputeId: dispute.id } }),
          this.paymentService.getTotalCapturedForBooking(booking.id),
        ]);
        dto.customer = customer;
        dto.welper = welper;
        if (resolutionRow) dto.resolution = this.resolutionToSummary(resolutionRow);
        if (captured) dto.capturedPayment = captured;
      }
      return dto;
    }
    if (!booking || (booking.customerId !== userId && booking.welperId !== userId)) {
      throw new ForbiddenException('You are not authorized to view this dispute');
    }
    return await this.toDto(dispute);
  }

  /**
   * DISPUTES-001 (Day 16): mints a 15-min presigned PUT URL for evidence
   * upload. The FE PUTs bytes directly to S3, then submits the returned `key`
   * as part of `evidence[]` on dispute create.
   *
   * Key shape: `disputes/<userId>/<uuid>.<ext>` — namespaced by user so a
   * stolen key can't reach another user's evidence; uuid prevents collisions
   * across reports; the original extension preserved for content sniffing.
   *
   * Validation already happened in the DTO (whitelisted contentType, sane
   * sizeBytes); we still defend against a missing extension and a degraded
   * presigner. Returns 503 when the presigner isn't configured — better than
   * a hopeful URL that won't actually upload.
   */
  async presignEvidenceUpload(
    userId: string,
    dto: DisputeEvidencePresignRequestDto,
  ): Promise<DisputeEvidencePresignResponseDto> {
    if (!this.s3Presigner.isConfigured()) {
      throw new ServiceUnavailableException(
        'Evidence upload is not available right now. Try again in a few minutes.',
      );
    }

    // Pull a clean extension. The DTO `fileName` is a hint — we sanitise; if
    // there's no usable extension we fall back to a content-type-derived one.
    const ext = this.extensionFor(dto.fileName, dto.contentType);
    const key = `disputes/${userId}/${randomUUID()}.${ext}`;

    const uploadUrl = await this.s3Presigner.presignPut(key, dto.contentType);
    if (!uploadUrl) {
      throw new ServiceUnavailableException(
        'Could not generate an upload URL. Try again in a few minutes.',
      );
    }

    return {
      uploadUrl,
      key,
      contentType: dto.contentType,
      ttlSeconds: this.s3Presigner.getTtlSeconds(),
    };
  }

  private extensionFor(fileName: string, contentType: string): string {
    const lower = fileName.toLowerCase();
    const dot = lower.lastIndexOf('.');
    if (dot !== -1 && dot < lower.length - 1) {
      const ext = lower.slice(dot + 1).replace(/[^a-z0-9]/g, '');
      if (ext.length > 0 && ext.length <= 8) return ext;
    }
    switch (contentType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/heic':
        return 'heic';
      case 'application/pdf':
        return 'pdf';
      default:
        return 'bin';
    }
  }

  /** Admin/support: create a resolution, resolve dispute, and transition booking out of disputed. */
  async createResolution(
    disputeId: string,
    adminUserId: string,
    dto: CreateResolutionDto,
  ): Promise<{
    id: string;
    disputeId: string;
    resolutionType: string;
    notes: string | null;
    refundAmount: number | null;
    resolvedAt: string;
    bookingId: string;
    bookingStatus: 'completed' | 'cancelled';
    stripeRefund: StripeRefundOutcome;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const disputeRepo = queryRunner.manager.getRepository(Dispute);
      const resolutionRepo = queryRunner.manager.getRepository(Resolution);
      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);

      const dispute = await disputeRepo
        .createQueryBuilder('d')
        .setLock('pessimistic_write')
        .where('d.id = :id', { id: disputeId })
        .getOne();
      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }
      if (!RESOLVABLE_STATUSES.includes(dispute.status)) {
        throw new BadRequestException('Dispute is not in a resolvable status');
      }
      const existing = await resolutionRepo.findOne({ where: { disputeId } });
      if (existing) {
        throw new ConflictException('This dispute already has a resolution');
      }

      const booking = await bookingRepo
        .createQueryBuilder('b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: dispute.bookingId })
        .getOne();
      if (!booking) {
        throw new NotFoundException('Booking not found for this dispute');
      }
      const canResolveAfterParticipantCancel =
        booking.status === BookingRequestStatus.CANCELLED &&
        RESOLVABLE_STATUSES.includes(dispute.status);

      if (booking.status !== BookingRequestStatus.DISPUTED && !canResolveAfterParticipantCancel) {
        throw new BadRequestException(
          'Booking must be in disputed status to apply a dispute resolution (unless cancelled while the dispute is still open)',
        );
      }

      if (dto.resolutionType === 'refund' || dto.resolutionType === 'partial_refund') {
        const cap = await this.paymentService.getTotalCapturedForBooking(booking.id);
        if (!cap || cap.totalCents <= 0) {
          throw new BadRequestException(
            'No captured card payments exist for this booking; choose a non-refund resolution or process the refund manually in Stripe.',
          );
        }
        if (dto.resolutionType === 'partial_refund') {
          let partialCents: number;
          try {
            partialCents = majorCurrencyUnitsToCents(dto.refundAmount!);
          } catch {
            throw new BadRequestException('Invalid partial refund amount');
          }
          if (partialCents > cap.totalCents) {
            throw new BadRequestException(
              `Refund amount exceeds total captured (${(cap.totalCents / 100).toFixed(2)} ${cap.currency.toUpperCase()})`,
            );
          }
        }
      }

      const now = new Date();
      const resolution = resolutionRepo.create({
        disputeId,
        resolutionType: dto.resolutionType,
        notes: dto.notes ?? null,
        refundAmount: dto.refundAmount ?? null,
        resolvedById: adminUserId,
        resolvedAt: now,
      });
      const saved = await resolutionRepo.save(resolution);

      dispute.status = 'resolved';
      await disputeRepo.save(dispute);

      if (booking.status === BookingRequestStatus.CANCELLED) {
        await queryRunner.commitTransaction();
        const refundResult = await this.runStripeRefundForResolution(booking.id, dto, saved.id);
        const stripeRefund = this.toStripeRefundOutcome(dto, refundResult);
        await this.adminAuditService.record(adminUserId, 'dispute.resolution', {
          disputeId,
          bookingId: booking.id,
          resolutionType: dto.resolutionType,
          bookingStatus: 'cancelled',
          stripeRefundStatus: stripeRefund.status,
        });

        // NOTIFICATIONS-001: resolution lands on BOTH parties. Bible §22 voice
        // — concrete, action-oriented. If a refund is in flight, surface that
        // fact so the customer doesn't refresh the page wondering.
        await this.emitDisputeNotifications(
          [booking.customerId, booking.welperId],
          'Dispute resolved',
          this.buildResolutionBody(dto, stripeRefund.status),
          { disputeId, bookingId: booking.id, status: 'resolved' },
        );

        return {
          id: saved.id,
          disputeId: saved.disputeId,
          resolutionType: saved.resolutionType,
          notes: saved.notes ?? null,
          refundAmount: saved.refundAmount != null ? Number(saved.refundAmount) : null,
          resolvedAt: saved.resolvedAt!.toISOString(),
          bookingId: booking.id,
          bookingStatus: 'cancelled',
          stripeRefund,
        };
      }

      const bookingOutcome = dto.bookingOutcome ?? 'completed';
      const nextStatus =
        bookingOutcome === 'cancelled'
          ? BookingRequestStatus.CANCELLED
          : BookingRequestStatus.COMPLETED;
      validateTransition(booking.status, nextStatus);

      booking.status = nextStatus;
      if (nextStatus === BookingRequestStatus.CANCELLED) {
        booking.cancelledAt = now;
        booking.cancelledBy = adminUserId;
        const reasonFromNotes = dto.notes?.trim();
        booking.cancellationReason =
          reasonFromNotes && reasonFromNotes.length > 0
            ? reasonFromNotes
            : 'Resolved as cancelled (dispute)';
      }
      await bookingRepo.save(booking);

      await queryRunner.commitTransaction();
      const refundResult = await this.runStripeRefundForResolution(booking.id, dto, saved.id);
      const stripeRefund = this.toStripeRefundOutcome(dto, refundResult);
      await this.adminAuditService.record(adminUserId, 'dispute.resolution', {
        disputeId,
        bookingId: booking.id,
        resolutionType: dto.resolutionType,
        bookingStatus: bookingOutcome,
        stripeRefundStatus: stripeRefund.status,
      });

      // NOTIFICATIONS-001: notify both parties about the resolution outcome.
      // The body adapts to whether a refund is involved so the customer
      // immediately understands their card situation.
      await this.emitDisputeNotifications(
        [booking.customerId, booking.welperId],
        'Dispute resolved',
        this.buildResolutionBody(dto, stripeRefund.status),
        { disputeId, bookingId: booking.id, status: 'resolved' },
      );

      return {
        id: saved.id,
        disputeId: saved.disputeId,
        resolutionType: saved.resolutionType,
        notes: saved.notes ?? null,
        refundAmount: saved.refundAmount != null ? Number(saved.refundAmount) : null,
        resolvedAt: saved.resolvedAt!.toISOString(),
        bookingId: booking.id,
        bookingStatus: bookingOutcome,
        stripeRefund,
      };
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Wave 2 (BFF): the original filer withdraws their own dispute before
   * admin resolves it. Soft-status change — the dispute row stays, status
   * flips to `withdrawn`, and the booking is sent back to a normal
   * post-service state (COMPLETED) so the welper can still receive payment.
   *
   * Authorization contract (bible §22.6):
   *  - Only the filer (`dispute.filerId`) may withdraw. Not the other party.
   *    Not admins (admins use `createResolution` instead).
   *  - Only when the dispute is in `WITHDRAWABLE_STATUSES`. Once admin has
   *    escalated or finalised, the participant loses the unilateral exit.
   *  - Returns 404 to non-participants so we don't reveal dispute existence.
   *
   * Audit emission: emits a `dispute.withdrawn` admin-audit row so support
   * can see the trail even though the actor is a participant (the actor id
   * is the filer, not staff). This matches the pattern used by
   * `createResolution`'s `dispute.resolution` record.
   */
  async withdraw(
    disputeId: string,
    userId: string,
  ): Promise<DisputeResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const disputeRepo = queryRunner.manager.getRepository(Dispute);
      const bookingRepo = queryRunner.manager.getRepository(BookingRequest);

      const dispute = await disputeRepo
        .createQueryBuilder('d')
        .setLock('pessimistic_write')
        .where('d.id = :id', { id: disputeId })
        .getOne();
      if (!dispute) {
        throw new NotFoundException('Dispute not found');
      }
      if (dispute.filerId !== userId) {
        // Not the filer — could be the counter-party or someone unrelated.
        // Both get 403; we don't enumerate "you're a participant but not the
        // filer" vs "you're nothing to this booking".
        throw new ForbiddenException('Only the dispute filer can withdraw it');
      }
      if (!WITHDRAWABLE_STATUSES.includes(dispute.status)) {
        throw new BadRequestException(
          `This dispute is in status "${dispute.status}" and can no longer be withdrawn. Contact support if needed.`,
        );
      }
      // Capture the pre-withdraw status BEFORE mutating, so the audit row
      // records what the participant withdrew FROM (open vs in_review).
      const previousStatus = dispute.status;

      const booking = await bookingRepo
        .createQueryBuilder('b')
        .setLock('pessimistic_write')
        .where('b.id = :id', { id: dispute.bookingId })
        .getOne();

      dispute.status = 'withdrawn';
      const savedDispute = await disputeRepo.save(dispute);

      // If the booking is still in DISPUTED, send it back to COMPLETED — the
      // welper still wants their money and the dispute is gone. If the booking
      // is in another state (already cancelled, etc.), leave it alone — we
      // don't want to silently change a participant-cancelled booking back to
      // active.
      if (booking && booking.status === BookingRequestStatus.DISPUTED) {
        validateTransition(booking.status, BookingRequestStatus.COMPLETED);
        booking.status = BookingRequestStatus.COMPLETED;
        if (booking.completedAt == null) {
          booking.completedAt = new Date();
        }
        await bookingRepo.save(booking);
      }

      await queryRunner.commitTransaction();

      // Audit log: keep a trail even though the actor isn't staff. Same audit
      // table the resolution flow writes to — search by `action =
      // 'dispute.withdrawn'` for the full history.
      await this.adminAuditService.record(userId, 'dispute.withdrawn', {
        disputeId,
        bookingId: dispute.bookingId,
        previousStatus,
        bookingRestoredToCompleted:
          booking?.status === BookingRequestStatus.COMPLETED,
      });

      // NOTIFICATIONS-001 (Wave 2 withdraw path): the COUNTERPARTY needs to
      // know the report was retracted — they may have been preparing a
      // response. Filer doesn't get pinged for their own action.
      if (booking) {
        const counterpartyId =
          booking.customerId === userId ? booking.welperId : booking.customerId;
        await this.emitDisputeNotifications(
          [counterpartyId],
          'Problem report withdrawn',
          'The other party withdrew the problem report. The booking is back to its normal state.',
          { disputeId, bookingId: dispute.bookingId, status: 'withdrawn' },
        );
      }

      return await this.toDto(savedDispute);
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * NOTIFICATIONS-001: pick a body that's honest about the refund outcome.
   * If Stripe failed or skipped, we don't claim "refund issued" — we point
   * the user to the dispute page where the admin notes will explain.
   */
  private buildResolutionBody(
    dto: CreateResolutionDto,
    refundStatus: StripeRefundOutcome['status'],
  ): string {
    if (dto.resolutionType === 'refund' || dto.resolutionType === 'partial_refund') {
      if (refundStatus === 'succeeded') {
        return dto.resolutionType === 'partial_refund'
          ? 'A partial refund has been issued for your booking. It can take a few business days to appear on your statement.'
          : 'A refund has been issued for your booking. It can take a few business days to appear on your statement.';
      }
      if (refundStatus === 'failed') {
        return 'The dispute was resolved, but the refund could not be processed automatically. Open the dispute for details and next steps.';
      }
      return 'The dispute has been resolved. Open it to review the outcome.';
    }
    return 'The dispute has been resolved. Open it to review the outcome.';
  }

  private async runStripeRefundForResolution(
    bookingId: string,
    dto: CreateResolutionDto,
    resolutionId: string,
  ): Promise<RefundCapturedResult | null> {
    if (dto.resolutionType !== 'refund' && dto.resolutionType !== 'partial_refund') {
      return null;
    }
    try {
      const partialCents =
        dto.resolutionType === 'partial_refund'
          ? majorCurrencyUnitsToCents(dto.refundAmount!)
          : undefined;
      return await this.paymentService.refundCapturedAmount(bookingId, resolutionId, partialCents);
    } catch (e) {
      const message = (e as Error).message;
      this.logger.warn(`Stripe refund failed for booking ${bookingId}: ${message}`);
      return { ok: false, refundsCreated: 0, message };
    }
  }

  private toStripeRefundOutcome(
    dto: CreateResolutionDto,
    result: RefundCapturedResult | null,
  ): StripeRefundOutcome {
    if (dto.resolutionType !== 'refund' && dto.resolutionType !== 'partial_refund') {
      return { status: 'not_applicable' };
    }
    if (!result) {
      return { status: 'failed', message: 'Refund was not executed' };
    }
    if (result.ok && result.skipped) {
      return { status: 'skipped', message: result.detail };
    }
    if (result.ok) {
      return { status: 'succeeded', refundsCreated: result.refundsCreated };
    }
    return {
      status: 'failed',
      message: result.message,
      refundsCreated: result.refundsCreated,
    };
  }
}
