import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserAccount } from './user-account.entity';

export enum RelationshipType {
  PARENT = 'Parent',
  LEGAL_GUARDIAN = 'Legal Guardian',
  OTHER = 'Other',
}

@Entity('guardian_accounts')
export class GuardianAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'guardian_user_id' })
  guardianUserId!: string;

  @Column({ name: 'minor_user_id' })
  minorUserId!: string;

  @Column({
    type: 'enum',
    enum: RelationshipType,
    name: 'relationship_type',
  })
  relationshipType!: RelationshipType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  // Relations
  @ManyToOne(() => UserAccount, (user) => user.guardianAccount)
  @JoinColumn({ name: 'guardian_user_id' })
  guardianUser!: UserAccount;

  @ManyToOne(() => UserAccount, (user) => user.minorAccount)
  @JoinColumn({ name: 'minor_user_id' })
  minorUser!: UserAccount;
}

