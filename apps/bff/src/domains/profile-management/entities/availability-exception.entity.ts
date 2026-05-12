import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { AvailabilityCalendar } from './availability-calendar.entity';

@Entity('availability_exceptions')
@Index(['calendarId'])
@Index(['date'])
@Index(['calendarId', 'date']) // Composite index for common query pattern
export class AvailabilityException extends BaseEntity {

  @Column({ name: 'calendar_id', type: 'uuid' })
  calendarId!: string; // Foreign key to AvailabilityCalendar

  @ManyToOne(() => AvailabilityCalendar, (calendar) => calendar.exceptions)
  @JoinColumn({ name: 'calendar_id' })
  calendar!: AvailabilityCalendar;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;

  @Column({ type: 'boolean' })
  available!: boolean;

  @Column({ type: 'text', nullable: true })
  reason!: string | null;
}

