import { Column, Entity, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { JobApplicationStatus } from './job-posting-status.enum';

@Entity('job_applications')
@Unique(['jobPostingId', 'welperId'])
@Index(['jobPostingId'])
@Index(['welperId'])
export class JobApplication extends BaseEntity {
  @Column({ name: 'job_posting_id', type: 'uuid' })
  jobPostingId!: string;

  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string;

  @Column({ name: 'offering_id', type: 'uuid' })
  offeringId!: string;

  @Column({ name: 'proposal_message', type: 'text' })
  proposalMessage!: string;

  @Column({ type: 'varchar', length: 32, default: JobApplicationStatus.PENDING })
  status!: JobApplicationStatus;

  @Column({ name: 'hourly_rate_snapshot', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRateSnapshot!: string | null;
}
