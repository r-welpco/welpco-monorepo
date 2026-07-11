import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WelperProfileViewCount } from '../entities/welper-profile-view-count.entity';
import {
  PROFILE_VIEW_SOURCES,
  ProfileViewStatsResponseDto,
  type ProfileViewSource,
} from './dto';

/**
 * SHARE-005 (BFF): fire-and-forget profile-view counting by share channel.
 *
 * Privacy rules (non-negotiable): no IP, no user agent, no viewer identity —
 * one atomic counter per (welper, src, day). `recordView` NEVER throws for
 * bad input or unknown welpers: the public endpoint always answers 204 so it
 * can't be used as a welper-id enumeration oracle.
 *
 * Rate limiting: no global throttler exists in the BFF today, so none is
 * applied here (noted as future work in the SHARE backlog). The unique-row
 * upsert bounds the damage to inflated counts, never row explosion.
 */
@Injectable()
export class ProfileViewsService {
  private readonly logger = new Logger(ProfileViewsService.name);

  constructor(
    @InjectRepository(WelperProfileViewCount)
    private readonly viewCountRepo: Repository<WelperProfileViewCount>,
  ) {}

  /** Normalize an arbitrary src string to the whitelist (else 'unknown'). Exposed for specs. */
  normalizeSrc(raw: string | undefined | null): ProfileViewSource {
    const src = (raw ?? '').trim().toLowerCase();
    return (PROFILE_VIEW_SOURCES as readonly string[]).includes(src)
      ? (src as ProfileViewSource)
      : 'unknown';
  }

  /**
   * Atomic ON CONFLICT increment. Silently swallows every failure (invalid
   * uuid, transient DB error) — the caller responds 204 regardless.
   */
  async recordView(welperId: string, rawSrc?: string): Promise<void> {
    const src = this.normalizeSrc(rawSrc);
    const day = new Date().toISOString().slice(0, 10); // UTC date
    try {
      await this.viewCountRepo.query(
        `INSERT INTO welper_profile_view_counts (welper_id, src, day, count)
         VALUES ($1, $2, $3, 1)
         ON CONFLICT (welper_id, src, day)
         DO UPDATE SET count = welper_profile_view_counts.count + 1, updated_at = CURRENT_TIMESTAMP`,
        [welperId, src, day],
      );
    } catch (err) {
      // Includes malformed welperId uuids — deliberate: 204 either way.
      this.logger.debug(`recordView swallowed error: ${(err as Error).message}`);
    }
  }

  async getStatsForWelper(welperId: string): Promise<ProfileViewStatsResponseDto> {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);

    const [bySrc, last30] = await Promise.all([
      this.viewCountRepo
        .createQueryBuilder('v')
        .select('v.src', 'src')
        .addSelect('COALESCE(SUM(v.count), 0)', 'total')
        .where('v.welper_id = :welperId', { welperId })
        .groupBy('v.src')
        .orderBy('total', 'DESC')
        .getRawMany<{ src: string; total: string }>(),
      this.viewCountRepo
        .createQueryBuilder('v')
        .select('COALESCE(SUM(v.count), 0)', 'total')
        .where('v.welper_id = :welperId', { welperId })
        .andWhere('v.day >= :cutoff', { cutoff })
        .getRawOne<{ total: string }>(),
    ]);

    const totalsBySrc = bySrc.map((r) => ({ src: r.src, count: Number(r.total) }));
    return {
      total: totalsBySrc.reduce((sum, r) => sum + r.count, 0),
      last30DaysTotal: Number(last30?.total ?? 0),
      totalsBySrc,
    };
  }
}
