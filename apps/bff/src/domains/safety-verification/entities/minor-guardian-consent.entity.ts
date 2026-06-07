import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserAccount } from '../../user-management/entities/user-account.entity';
import { RelationshipType } from '../../user-management/entities/guardian-account.entity';

export enum GuardianConsentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  DECLINED = 'declined',
  EXPIRED = 'expired',
}

@Entity('minor_guardian_consents')
export class MinorGuardianConsent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'minor_user_id', type: 'uuid' })
  @Index({ unique: true })
  minorUserId!: string;

  @Column({ name: 'guardian_full_name', type: 'varchar', length: 200 })
  guardianFullName!: string;

  @Column({ name: 'guardian_email', type: 'varchar', length: 255 })
  guardianEmail!: string;

  @Column({ name: 'guardian_phone', type: 'varchar', length: 32 })
  guardianPhone!: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    name: 'relationship_type',
  })
  relationshipType!: RelationshipType;

  @Column({
    type: 'enum',
    enum: GuardianConsentStatus,
    default: GuardianConsentStatus.PENDING,
  })
  status!: GuardianConsentStatus;

  @Column({ name: 'token_hash', type: 'varchar', length: 64, nullable: true })
  tokenHash!: string | null;

  @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
  tokenExpiresAt!: Date | null;

  @Column({ name: 'consented_at', type: 'timestamptz', nullable: true })
  consentedAt!: Date | null;

  @Column({ name: 'ip_address', type: 'varchar', length: 45, nullable: true })
  ipAddress!: string | null;

  @Column({ name: 'user_agent', type: 'varchar', length: 500, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => UserAccount)
  @JoinColumn({ name: 'minor_user_id' })
  minorUser!: UserAccount;
}
