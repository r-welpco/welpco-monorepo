import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { JobPostingStatus } from './job-posting-status.enum';

@Entity('job_postings')
@Index(['customerId'])
@Index(['status'])
@Index(['subcategoryId'])
@Index(['expiresAt'])
export class JobPosting extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string;

  @Column({ name: 'category_id', type: 'uuid' })
  categoryId!: string;

  @Column({ name: 'subcategory_id', type: 'uuid' })
  subcategoryId!: string;

  @Column({ name: 'service_question_category_id', type: 'uuid' })
  serviceQuestionCategoryId!: string;

  @Column({ type: 'jsonb', default: {} })
  answers!: Record<string, string | number | boolean>;

  @Column({ type: 'varchar', length: 200 })
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ name: 'scheduled_date', type: 'date' })
  scheduledDate!: string;

  @Column({ name: 'scheduled_start_time', type: 'time' })
  scheduledStartTime!: string;

  @Column({ name: 'scheduled_end_time', type: 'time' })
  scheduledEndTime!: string;

  @Column({ name: 'duration_minutes', type: 'int' })
  durationMinutes!: number;

  @Column({ name: 'location_address', type: 'varchar', length: 500 })
  locationAddress!: string;

  @Column({ name: 'location_lat', type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLat!: string | null;

  @Column({ name: 'location_lng', type: 'decimal', precision: 10, scale: 7, nullable: true })
  locationLng!: string | null;

  @Column({ name: 'location_city', type: 'varchar', length: 120, nullable: true })
  locationCity!: string | null;

  @Column({ name: 'location_region', type: 'varchar', length: 120, nullable: true })
  locationRegion!: string | null;

  @Column({ type: 'varchar', length: 32, default: JobPostingStatus.PUBLISHED })
  status!: JobPostingStatus;

  @Column({ name: 'application_count', type: 'int', default: 0 })
  applicationCount!: number;

  @Column({ name: 'max_applications', type: 'int', default: 20 })
  maxApplications!: number;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ name: 'booking_id', type: 'uuid', nullable: true })
  bookingId!: string | null;

  @Column({ name: 'published_at', type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;
}
