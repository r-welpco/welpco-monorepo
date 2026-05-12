import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { WelperProfile } from './welper-profile.entity';
import { AvailabilityException } from './availability-exception.entity';
import { DayOfWeek } from './day-of-week.enum';
import { RecurringPattern } from './recurring-pattern.enum';

@Entity('availability_calendars')
@Index(['welperId'])
@Index(['dayOfWeek'])
@Index(['available'])
@Index(['welperId', 'dayOfWeek']) // Composite index for common query pattern
export class AvailabilityCalendar extends BaseEntity {
  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string; // Foreign key to WelperProfile

  @ManyToOne(() => WelperProfile, (profile) => profile.availabilityCalendars)
  @JoinColumn({ name: 'welper_id', referencedColumnName: 'welperId' })
  welperProfile!: WelperProfile;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    name: 'day_of_week',
  })
  dayOfWeek!: DayOfWeek;

  @Column({ name: 'start_time', type: 'time' })
  startTime!: string;

  @Column({ name: 'end_time', type: 'time' })
  endTime!: string;

  @Column({
    type: 'enum',
    enum: RecurringPattern,
    name: 'recurring_pattern',
  })
  recurringPattern!: RecurringPattern;

  @Column({ type: 'boolean', default: true })
  available!: boolean;

  @Column({ name: 'effective_date_start', type: 'date', nullable: true })
  effectiveDateStart!: Date | null;

  @Column({ name: 'effective_date_end', type: 'date', nullable: true })
  effectiveDateEnd!: Date | null;

  // Relations
  @OneToMany(() => AvailabilityException, (exception) => exception.calendar)
  exceptions!: AvailabilityException[];
}

