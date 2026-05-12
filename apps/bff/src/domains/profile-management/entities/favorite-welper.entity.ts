import {
  Entity,
  Column,
  Index,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';

@Entity('favorite_welpers')
@Unique(['customerId', 'welperId'])
@Index(['customerId'])
@Index(['welperId'])
@Index(['customerId', 'createdAt']) // For sorting favorites by creation date
export class FavoriteWelper extends BaseEntity {
  @Column({ name: 'customer_id', type: 'uuid' })
  customerId!: string; // Foreign key to CustomerProfile (UUID)

  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string; // Foreign key to WelperProfile (UUID)

  @Column({ type: 'text', nullable: true })
  notes!: string | null;
}

