import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { S3UrlPresignerService } from '../../../clients/s3';
import {
  buildPublicObjectUrl,
  resolveS3Bucket,
  resolveS3Region,
} from '../../../clients/s3/s3-config.util';
import { NotificationService } from '../../notification/notification.service';
import { NotificationCategory } from '../../notification/entities';
import { WelperPortfolioPhoto } from '../entities/welper-portfolio-photo.entity';
import { PortfolioPhotoStatus } from '../entities/portfolio-photo-status.enum';
import { ServiceOffering } from '../entities/service-offering.entity';
import { WelperProfile } from '../entities/welper-profile.entity';
import {
  CreatePortfolioPhotoDto,
  ModeratePortfolioPhotoDto,
  PortfolioPhotoResponseDto,
  PortfolioPresignRequestDto,
  PortfolioPresignResponseDto,
  PublicPortfolioPhotoDto,
  ReorderPortfolioDto,
  UpdatePortfolioPhotoDto,
  PORTFOLIO_MAX_PHOTOS,
} from './dto';

export interface AdminPortfolioPhotoListItem extends PortfolioPhotoResponseDto {
  welperName: string;
}

export interface AdminPortfolioPhotoListResult {
  items: AdminPortfolioPhotoListItem[];
  total: number;
  page: number;
  limit: number;
}

/**
 * SHARE-001 (BFF): welper portfolio photos — presigned upload, own-photo CRUD,
 * public read (approved only) and admin moderation.
 *
 * Upload flow mirrors dispute evidence: the browser PUTs bytes straight to S3
 * with a 15-min presigned URL, then registers the key here. Keys are
 * namespaced `portfolio/{welperId}/…` and `create` verifies the namespace so
 * a stolen key can't be attached to another welper's gallery.
 */
@Injectable()
export class PortfolioService {
  private readonly logger = new Logger(PortfolioService.name);

  constructor(
    @InjectRepository(WelperPortfolioPhoto)
    private readonly photoRepo: Repository<WelperPortfolioPhoto>,
    @InjectRepository(ServiceOffering)
    private readonly offeringRepo: Repository<ServiceOffering>,
    @InjectRepository(WelperProfile)
    private readonly welperProfileRepo: Repository<WelperProfile>,
    private readonly s3Presigner: S3UrlPresignerService,
    private readonly configService: ConfigService,
    private readonly notificationService: NotificationService,
  ) {}

  // ---------------------------------------------------------------- presign

  async presignUpload(
    welperId: string,
    dto: PortfolioPresignRequestDto,
  ): Promise<PortfolioPresignResponseDto> {
    if (!this.s3Presigner.isConfigured()) {
      throw new ServiceUnavailableException(
        'Photo upload is not available right now. Try again in a few minutes.',
      );
    }

    const key = `portfolio/${welperId}/${randomUUID()}.${this.extensionFor(dto.contentType)}`;
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

  // ------------------------------------------------------------ welper CRUD

  async create(welperId: string, dto: CreatePortfolioPhotoDto): Promise<PortfolioPhotoResponseDto> {
    // Namespace check: the key must have been minted for THIS welper.
    if (!dto.s3Key.startsWith(`portfolio/${welperId}/`)) {
      throw new BadRequestException({
        code: 'INVALID_S3_KEY',
        message: 'The uploaded file key does not belong to your portfolio namespace.',
      });
    }

    const count = await this.photoRepo.count({ where: { welperId } });
    if (count >= PORTFOLIO_MAX_PHOTOS) {
      throw new ConflictException({
        code: 'PORTFOLIO_LIMIT_REACHED',
        message: `You can have at most ${PORTFOLIO_MAX_PHOTOS} portfolio photos. Delete one to add another.`,
      });
    }

    if (dto.offeringId) {
      const offering = await this.offeringRepo.findOne({
        where: { id: dto.offeringId, welperId },
      });
      if (!offering) {
        throw new BadRequestException({
          code: 'OFFERING_NOT_FOUND',
          message: 'The referenced service offering does not exist or is not yours.',
        });
      }
    }

    const maxSort = await this.photoRepo
      .createQueryBuilder('p')
      .select('COALESCE(MAX(p.sort_order), -1)', 'max')
      .where('p.welper_id = :welperId', { welperId })
      .getRawOne<{ max: string }>();

    const photo = this.photoRepo.create({
      welperId,
      offeringId: dto.offeringId ?? null,
      s3Key: dto.s3Key,
      caption: dto.caption?.trim() || null,
      sortOrder: Number(maxSort?.max ?? -1) + 1,
      status: PortfolioPhotoStatus.PENDING,
      rejectionReason: null,
    });
    const saved = await this.photoRepo.save(photo);
    return this.toResponse(saved);
  }

  async listOwn(welperId: string): Promise<PortfolioPhotoResponseDto[]> {
    const photos = await this.photoRepo.find({
      where: { welperId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    return photos.map((p) => this.toResponse(p));
  }

  async update(
    welperId: string,
    photoId: string,
    dto: UpdatePortfolioPhotoDto,
  ): Promise<PortfolioPhotoResponseDto> {
    const photo = await this.findOwnedPhoto(welperId, photoId);
    if (dto.caption !== undefined) {
      photo.caption = dto.caption.trim() || null;
    }
    if (dto.sortOrder !== undefined) {
      photo.sortOrder = dto.sortOrder;
    }
    const saved = await this.photoRepo.save(photo);
    return this.toResponse(saved);
  }

  async reorder(welperId: string, dto: ReorderPortfolioDto): Promise<PortfolioPhotoResponseDto[]> {
    const uniqueIds = [...new Set(dto.photoIds)];
    const owned = await this.photoRepo.find({ where: { welperId, id: In(uniqueIds) } });
    if (owned.length !== uniqueIds.length) {
      throw new BadRequestException({
        code: 'INVALID_PHOTO_IDS',
        message: 'One or more photo ids do not exist or are not yours.',
      });
    }

    const byId = new Map(owned.map((p) => [p.id, p]));
    const updates: WelperPortfolioPhoto[] = [];
    uniqueIds.forEach((id, index) => {
      const photo = byId.get(id)!;
      if (photo.sortOrder !== index) {
        photo.sortOrder = index;
      }
      updates.push(photo);
    });

    // Photos not in the list are pushed after the reordered block, keeping
    // their previous relative order.
    const rest = await this.photoRepo.find({
      where: { welperId },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
    let tail = uniqueIds.length;
    for (const photo of rest) {
      if (!byId.has(photo.id)) {
        photo.sortOrder = tail++;
        updates.push(photo);
      }
    }

    await this.photoRepo.save(updates);
    return this.listOwn(welperId);
  }

  async remove(welperId: string, photoId: string): Promise<{ deleted: true }> {
    const photo = await this.findOwnedPhoto(welperId, photoId);
    await this.photoRepo.remove(photo);
    // S3 object cleanup is deliberately deferred (no lifecycle worker yet);
    // orphaned keys are unreachable — nothing references them.
    return { deleted: true };
  }

  // ------------------------------------------------------------ public read

  /**
   * Approved photos for the public profile — ordered, capped, and stripped of
   * moderation metadata. Consumed by service-discovery's public profile
   * response (`GET /api/search/welpers/:welperId`).
   */
  async listApprovedPublic(welperId: string): Promise<PublicPortfolioPhotoDto[]> {
    const photos = await this.photoRepo.find({
      where: { welperId, status: PortfolioPhotoStatus.APPROVED },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      take: PORTFOLIO_MAX_PHOTOS,
    });
    return photos.map((p) => ({
      id: p.id,
      url: this.publicUrlFor(p.s3Key),
      caption: p.caption,
      offeringId: p.offeringId,
    }));
  }

  // ----------------------------------------------------------------- admin

  async listForAdmin(
    status: PortfolioPhotoStatus | undefined,
    page: number,
    limit: number,
  ): Promise<AdminPortfolioPhotoListResult> {
    const where = status ? { status } : {};
    const [photos, total] = await this.photoRepo.findAndCount({
      where,
      order: { createdAt: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const welperIds = [...new Set(photos.map((p) => p.welperId))];
    const profiles = welperIds.length
      ? await this.welperProfileRepo.find({
          where: { welperId: In(welperIds) },
          select: ['welperId', 'firstName', 'lastName'],
        })
      : [];
    const nameByWelperId = new Map(
      profiles.map((p) => [
        p.welperId,
        [p.firstName, p.lastName].filter(Boolean).join(' ') || 'Unknown welper',
      ]),
    );

    return {
      items: photos.map((p) => ({
        ...this.toResponse(p),
        welperName: nameByWelperId.get(p.welperId) ?? 'Unknown welper',
      })),
      total,
      page,
      limit,
    };
  }

  async moderate(
    photoId: string,
    dto: ModeratePortfolioPhotoDto,
  ): Promise<PortfolioPhotoResponseDto> {
    const photo = await this.photoRepo.findOne({ where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Portfolio photo not found');
    }

    if (dto.status === PortfolioPhotoStatus.APPROVED) {
      photo.status = PortfolioPhotoStatus.APPROVED;
      photo.rejectionReason = null;
    } else {
      photo.status = PortfolioPhotoStatus.REJECTED;
      photo.rejectionReason = dto.rejectionReason?.trim() || null;
    }
    const saved = await this.photoRepo.save(photo);

    if (saved.status === PortfolioPhotoStatus.REJECTED) {
      await this.notifyRejection(saved);
    }
    return this.toResponse(saved);
  }

  /**
   * Preference-aware in-app/email notify on rejection — same emit convention
   * as booking/job notifications (plain title/body, localized by the user's
   * preferred locale).
   */
  private async notifyRejection(photo: WelperPortfolioPhoto): Promise<void> {
    try {
      const locale = await this.notificationService.resolveLocaleForUser(photo.welperId);
      const reason = photo.rejectionReason;
      const isFr = locale === 'fr';
      const title = isFr ? 'Photo de portfolio non approuvée' : 'A portfolio photo wasn’t approved';
      const body = reason
        ? isFr
          ? `Une photo de votre portfolio n’a pas été approuvée : ${reason}`
          : `A portfolio photo wasn’t approved: ${reason}`
        : isFr
          ? 'Une photo de votre portfolio n’a pas été approuvée. Vous pouvez la remplacer depuis votre profil.'
          : 'A portfolio photo wasn’t approved. You can replace it from your profile.';
      await this.notificationService.emitForUser(photo.welperId, {
        category: NotificationCategory.SYSTEM,
        title,
        body,
        metadata: { portfolioPhotoId: photo.id },
      });
    } catch (err) {
      // Notification failure must never fail the moderation action.
      this.logger.warn(
        `Failed to notify welper ${photo.welperId} of portfolio rejection: ${(err as Error).message}`,
      );
    }
  }

  // ---------------------------------------------------------------- helpers

  private async findOwnedPhoto(welperId: string, photoId: string): Promise<WelperPortfolioPhoto> {
    // 404 (not 403) when the photo exists but belongs to someone else — no
    // existence oracle for other welpers' photo ids.
    const photo = await this.photoRepo.findOne({ where: { id: photoId, welperId } });
    if (!photo) {
      throw new NotFoundException('Portfolio photo not found');
    }
    return photo;
  }

  private toResponse(photo: WelperPortfolioPhoto): PortfolioPhotoResponseDto {
    return {
      id: photo.id,
      welperId: photo.welperId,
      offeringId: photo.offeringId,
      s3Key: photo.s3Key,
      url: this.publicUrlFor(photo.s3Key),
      caption: photo.caption,
      sortOrder: photo.sortOrder,
      status: photo.status,
      rejectionReason: photo.rejectionReason,
      createdAt: photo.createdAt,
    };
  }

  /**
   * Display URL resolution mirrors how `profilePhotoUrl` is built today
   * (`uploads.service.ts`): an unsigned public-bucket URL. Bucket/region
   * resolution matches `S3UrlPresignerService` (S3_BUCKET_EVIDENCE ??
   * AWS_S3_BUCKET) so display URLs always point at the bucket the presigned
   * PUT wrote to.
   */
  private publicUrlFor(key: string): string | null {
    const bucket = resolveS3Bucket(this.configService);
    const region = resolveS3Region(this.configService);
    if (!bucket || !region) return null;
    return buildPublicObjectUrl(this.configService, bucket, region, key);
  }

  private extensionFor(contentType: string): string {
    switch (contentType) {
      case 'image/jpeg':
        return 'jpg';
      case 'image/png':
        return 'png';
      case 'image/webp':
        return 'webp';
      case 'image/heic':
        return 'heic';
      default:
        return 'bin';
    }
  }
}
