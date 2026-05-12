import {
  Entity,
  Column,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ServiceQuestion } from './service-question.entity';

export enum QuestionType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  TIME = 'time',
  CHOICE = 'choice',
  BOOLEAN = 'boolean',
  ENTITY_REFERENCE = 'entity_reference',
}

export enum EntityType {
  CHILD = 'child',
  PERSON = 'person',
  PET = 'pet',
}

@Entity('questions')
@Index(['type'])
@Index(['entityType'])
export class Question extends BaseEntity {
  @Column({
    type: 'enum',
    enum: QuestionType,
  })
  type!: QuestionType;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  placeholder!: string | null;

  @Column({ name: 'help_text', type: 'text', nullable: true })
  helpText!: string | null;

  @Column({ name: 'validation_rules', type: 'jsonb', nullable: true })
  validationRules!: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  options!: Array<{ value: string; label: string }> | null; // For choice type

  @Column({ name: 'entity_type', type: 'enum', enum: EntityType, nullable: true })
  entityType!: EntityType | null; // For entity_reference type

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @OneToMany(() => ServiceQuestion, (serviceQuestion) => serviceQuestion.question)
  serviceQuestions!: ServiceQuestion[];
}
