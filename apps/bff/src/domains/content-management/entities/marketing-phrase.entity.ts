import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

export enum PhraseType {
  CTA = 'cta',
  SLOGAN = 'slogan',
  TAGLINE = 'tagline',
}

@Entity('marketing_phrases')
@Index(['phraseType'])
@Index(['usageContext'])
@Index(['isActive'])
export class MarketingPhrase extends BaseEntity {
  @Column({ name: 'phrase_text', type: 'text' })
  phraseText!: string;

  @Column({
    name: 'phrase_type',
    type: 'enum',
    enum: PhraseType,
  })
  phraseType!: PhraseType;

  @Column({ name: 'usage_context', type: 'varchar', length: 100, nullable: true })
  usageContext!: string | null; // e.g., 'homepage', 'registration', etc.

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
