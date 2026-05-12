import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('application_settings')
export class ApplicationSetting extends BaseEntity {
  @Column({ type: 'varchar', length: 128, unique: true })
  key!: string;

  @Column({ type: 'text', nullable: true })
  value!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;
}
