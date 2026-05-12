import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

export enum FAQCategory {
  CUSTOMER = 'customer',
  WELPER = 'welper',
  GENERAL = 'general',
}

@Entity('faq_items')
@Index(['category'])
@Index(['isActive'])
export class FAQItem extends BaseEntity {
  @Column({
    type: 'enum',
    enum: FAQCategory,
  })
  category!: FAQCategory;

  @Column({ type: 'text' })
  question!: string;

  @Column({ type: 'text' })
  answer!: string;

  @Column({ name: 'display_order', type: 'integer', default: 0 })
  displayOrder!: number;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
