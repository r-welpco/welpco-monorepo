import {
  Entity,
  Column,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ServiceCategory } from './service-category.entity';
import { Question } from './question.entity';

@Entity('service_questions')
@Index(['serviceCategoryId'])
@Index(['questionId'])
@Index(['serviceCategoryId', 'displayOrder'])
export class ServiceQuestion extends BaseEntity {
  @Column({ name: 'service_category_id', type: 'uuid' })
  serviceCategoryId!: string;

  @ManyToOne(() => ServiceCategory, (category) => category.serviceQuestions)
  @JoinColumn({ name: 'service_category_id' })
  serviceCategory!: ServiceCategory;

  @Column({ name: 'question_id', type: 'uuid' })
  questionId!: string;

  @ManyToOne(() => Question, (question) => question.serviceQuestions)
  @JoinColumn({ name: 'question_id' })
  question!: Question;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_required', type: 'boolean', default: true })
  isRequired!: boolean;

  @Column({ name: 'conditional_logic', type: 'jsonb', nullable: true })
  conditionalLogic!: {
    showIf?: {
      questionId: string;
      value: string | number | boolean;
    };
  } | null;
}
