import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ReviewerType } from './reviewer-type.enum';

@Entity('reviews')
@Index(['bookingId', 'reviewerId'], { unique: true })
@Index(['revieweeId'])
@Index(['bookingId'])
export class Review extends BaseEntity {
  @Column({ name: 'booking_id', type: 'uuid' })
  bookingId!: string;

  @Column({ name: 'reviewer_id', type: 'uuid' })
  reviewerId!: string;

  @Column({ name: 'reviewee_id', type: 'uuid' })
  revieweeId!: string;

  @Column({ name: 'reviewer_type', type: 'varchar', length: 20 })
  reviewerType!: ReviewerType;

  @Column({ type: 'smallint' })
  rating!: number; // 1-5

  @Column({ type: 'text', nullable: true })
  comment!: string | null;
}
