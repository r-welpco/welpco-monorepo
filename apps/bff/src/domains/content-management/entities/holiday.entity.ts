import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('holidays')
@Index(['countryCode', 'provinceCode'])
@Index(['date'])
export class Holiday extends BaseEntity {
  @Column({ name: 'country_code', type: 'varchar', length: 2 })
  countryCode!: string;

  @Column({ name: 'province_code', type: 'varchar', length: 10, nullable: true })
  provinceCode!: string | null;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate!: Date | null;
}
