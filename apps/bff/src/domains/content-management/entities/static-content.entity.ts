import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

export enum ContentType {
  ABOUT_US = 'about_us',
  FAQ = 'faq',
  TERMS = 'terms',
  PRIVACY = 'privacy',
  CONTACT = 'contact',
  HOMEPAGE = 'homepage',
}

@Entity('static_content')
@Index(['contentType'])
@Index(['isPublished'])
export class StaticContent extends BaseEntity {
  @Column({
    name: 'content_type',
    type: 'enum',
    enum: ContentType,
  })
  contentType!: ContentType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ name: 'is_published', type: 'boolean', default: true })
  isPublished!: boolean;

  @Column({ name: 'published_date', type: 'timestamp', nullable: true })
  publishedDate!: Date | null;
}
