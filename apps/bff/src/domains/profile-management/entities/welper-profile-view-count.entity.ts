import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

/**
 * SHARE-005: privacy-preserving public-profile view counter.
 *
 * One row per (welper, src, day) — incremented atomically with an
 * `INSERT … ON CONFLICT DO UPDATE` upsert. Deliberately stores NO IP, NO
 * user agent, NO viewer identity: just an aggregate count keyed by the share
 * channel (`src`) so the share hub can show "your poster brought N visits".
 */
@Entity('welper_profile_view_counts')
@Index(['welperId', 'src', 'day'], { unique: true })
@Index(['welperId', 'day'])
export class WelperProfileViewCount extends BaseEntity {
  /** FK to UserAccount (UUID, not an actual DB FK — no enumeration coupling). */
  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string;

  /**
   * Normalized share-channel code (lowercase). Whitelisted at write time to
   * `link | qr | story | square | og | qr-story | qr-square | qr-landscape |
   * direct | unknown` — anything else is bucketed into `unknown` so the
   * column can't be used as a free-text sink.
   */
  @Column({ type: 'varchar', length: 24 })
  src!: string;

  /** Aggregation day (UTC date). */
  @Column({ type: 'date' })
  day!: string;

  @Column({ type: 'integer', default: 0 })
  count!: number;
}
