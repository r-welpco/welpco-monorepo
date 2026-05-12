import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/base-entity';
import { ServiceArea } from '../../../common/types';

@Entity('service_offerings')
@Index(['welperId'])
@Index(['serviceCategoryId'])
@Index(['active'])
@Index(['welperId', 'active']) // Composite index for common query pattern
export class ServiceOffering extends BaseEntity {
  @Column({ name: 'welper_id', type: 'uuid' })
  welperId!: string; // Foreign key to WelperProfile (references welper_profiles.welper_id, not id)

  // Note: We don't use @ManyToOne here because welper_id references welper_profiles.welper_id (not id)
  // The foreign key constraint is managed via migration
  // welperProfile?: WelperProfile; // Optional relation for queries if needed

  @Column({ name: 'service_category_id', type: 'uuid' })
  serviceCategoryId!: string; // Foreign key to Content Management (UUID)

  @Column({ name: 'service_description', type: 'text' })
  serviceDescription!: string;

  @Column({
    name: 'hourly_rate',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: false,
  })
  hourlyRate!: number; // Required per offering

  @Column({ name: 'experience_years', type: 'integer', nullable: false })
  experienceYears!: number; // Experience in years for this specific service

  @Column({ name: 'service_area', type: 'jsonb', nullable: true })
  serviceArea!: ServiceArea | null; // Overrides default if set (GeoJSON)

  @Column({ name: 'subcategory_ids', type: 'jsonb', nullable: true, default: () => "'[]'::jsonb" })
  subcategoryIds!: string[]; // Array of subcategory UUIDs

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}

