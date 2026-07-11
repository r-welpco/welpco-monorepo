import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { PortfolioPhotoStatus } from './portfolio-photo-status.enum';

/**
 * SHARE-001: a single welper portfolio ("work proof") photo.
 *
 * The bytes live in S3 under `portfolio/{welperId}/{uuid}.{ext}` (uploaded
 * directly by the browser via a presigned PUT — mirrors the dispute-evidence
 * pattern). This row is the metadata + moderation state. Public profile
 * responses only ever serve `approved` rows.
 */
@Entity('welper_portfolio_photos')
@Index(['welperId'])
@Index(['welperId', 'status', 'sortOrder'])
export class WelperPortfolioPhoto extends BaseEntity {
  /** FK to UserAccount (UUID, not an actual DB FK — matches welper_profiles). */
  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string;

  /** Optional album link to one of the welper's service offerings. */
  @Column({ name: 'offering_id', type: 'uuid', nullable: true })
  offeringId!: string | null;

  /** S3 object key, namespaced per welper: `portfolio/{welperId}/{uuid}.{ext}`. */
  @Column({ name: 's3_key', type: 'varchar', length: 512 })
  s3Key!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  caption!: string | null;

  @Column({ name: 'sort_order', type: 'integer', default: 0 })
  sortOrder!: number;

  /** Moderation status — varchar (not pg enum) per the dispute-domain convention. */
  @Column({
    type: 'varchar',
    length: 16,
    default: PortfolioPhotoStatus.PENDING,
  })
  status!: PortfolioPhotoStatus;

  /** Set by admins on rejection; shown to the owner only. */
  @Column({ name: 'rejection_reason', type: 'varchar', length: 500, nullable: true })
  rejectionReason!: string | null;
}
