import {
  Entity,
  Column,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ServiceQuestion } from './service-question.entity';

@Entity('service_categories')
@Index(['parentId'])
@Index(['level'])
@Index(['isActive'])
export class ServiceCategory extends BaseEntity {
  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ name: 'parent_id', type: 'uuid', nullable: true })
  parentId!: string | null;

  @ManyToOne(() => ServiceCategory, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent!: ServiceCategory | null;

  @OneToMany(() => ServiceCategory, (category) => category.parent)
  children!: ServiceCategory[];

  @OneToMany(() => ServiceQuestion, (serviceQuestion) => serviceQuestion.serviceCategory, { cascade: true })
  serviceQuestions!: ServiceQuestion[];

  @Column({ type: 'integer', default: 1 })
  level!: number; // 1 = main category, 2 = subcategory, 3 = service type

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @Column({ name: 'icon', type: 'varchar', length: 255, nullable: true })
  icon!: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
