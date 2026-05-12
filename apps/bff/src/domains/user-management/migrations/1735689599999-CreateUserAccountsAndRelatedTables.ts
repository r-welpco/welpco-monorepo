import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

/**
 * Baseline user-management schema for a fresh database.
 * Older migrations assumed these tables already existed from a prior service; the consolidated BFF needs this for greenfield `migration:run`.
 */
export class CreateUserAccountsAndRelatedTables1735689599999 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('user_accounts')) {
      return;
    }

    await queryRunner.createTable(
      new Table({
        name: 'user_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'email',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'password_hash',
            type: 'varchar',
          },
          {
            name: 'account_type',
            type: 'enum',
            enum: ['Customer', 'Welper', 'Guardian'],
            enumName: 'user_accounts_account_type_enum',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Pending', 'Active', 'Suspended', 'Deactivated'],
            enumName: 'user_accounts_status_enum',
            default: "'Pending'",
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'last_login_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createTable(
      new Table({
        name: 'verification_statuses',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isUnique: true,
          },
          {
            name: 'email_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'background_check_status',
            type: 'enum',
            enum: [
              'Not Required',
              'Pending',
              'In Progress',
              'Passed',
              'Failed',
              'Expired',
            ],
            enumName: 'verification_statuses_background_check_status_enum',
            default: "'Not Required'",
          },
          {
            name: 'identity_verified',
            type: 'boolean',
            default: false,
          },
          {
            name: 'verification_date',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'verification_statuses',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'guardian_accounts',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'guardian_user_id',
            type: 'uuid',
          },
          {
            name: 'minor_user_id',
            type: 'uuid',
          },
          {
            name: 'relationship_type',
            type: 'enum',
            enum: ['Parent', 'Legal Guardian', 'Other'],
            enumName: 'guardian_accounts_relationship_type_enum',
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'guardian_accounts',
      new TableForeignKey({
        columnNames: ['guardian_user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'guardian_accounts',
      new TableForeignKey({
        columnNames: ['minor_user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'referral_codes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'code',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'code_type',
            type: 'enum',
            enum: ['Personal', 'Campaign'],
            enumName: 'referral_codes_code_type_enum',
            default: "'Personal'",
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'referral_codes',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'referrals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'referrer_user_id',
            type: 'uuid',
          },
          {
            name: 'referee_user_id',
            type: 'uuid',
          },
          {
            name: 'referral_code_id',
            type: 'uuid',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['Pending', 'Completed', 'Rewarded', 'Expired'],
            enumName: 'referrals_status_enum',
            default: "'Pending'",
          },
          {
            name: 'referral_date',
            type: 'timestamptz',
          },
          {
            name: 'completion_date',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'reward_status',
            type: 'enum',
            enum: ['Pending', 'Awarded', 'Expired'],
            enumName: 'referrals_reward_status_enum',
            default: "'Pending'",
          },
          {
            name: 'reward_amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'reward_date',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'referrals',
      new TableForeignKey({
        columnNames: ['referrer_user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'referrals',
      new TableForeignKey({
        columnNames: ['referee_user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createForeignKey(
      'referrals',
      new TableForeignKey({
        columnNames: ['referral_code_id'],
        referencedTableName: 'referral_codes',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'email_verification_tokens',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
          },
          {
            name: 'token',
            type: 'varchar',
            isUnique: true,
          },
          {
            name: 'expires_at',
            type: 'timestamptz',
          },
          {
            name: 'used_at',
            type: 'timestamptz',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    await queryRunner.createForeignKey(
      'email_verification_tokens',
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('email_verification_tokens', true);
    await queryRunner.dropTable('referrals', true);
    await queryRunner.dropTable('referral_codes', true);
    await queryRunner.dropTable('guardian_accounts', true);
    await queryRunner.dropTable('verification_statuses', true);
    await queryRunner.dropTable('user_accounts', true);
  }
}
