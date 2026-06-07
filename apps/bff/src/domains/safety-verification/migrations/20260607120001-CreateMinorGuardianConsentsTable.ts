import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMinorGuardianConsentsTable20260607120001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "minor_guardian_consents_status_enum" AS ENUM ('pending', 'approved', 'declined', 'expired');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.createTable(
      new Table({
        name: 'minor_guardian_consents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          { name: 'minor_user_id', type: 'uuid', isNullable: false },
          { name: 'guardian_full_name', type: 'varchar', length: '200', isNullable: false },
          { name: 'guardian_email', type: 'varchar', length: '255', isNullable: false },
          { name: 'guardian_phone', type: 'varchar', length: '32', isNullable: false },
          {
            name: 'relationship_type',
            type: 'enum',
            enum: ['Parent', 'Legal Guardian', 'Other'],
            enumName: 'guardian_accounts_relationship_type_enum',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'declined', 'expired'],
            enumName: 'minor_guardian_consents_status_enum',
            default: "'pending'",
          },
          { name: 'token_hash', type: 'varchar', length: '64', isNullable: true },
          { name: 'token_expires_at', type: 'timestamptz', isNullable: true },
          { name: 'consented_at', type: 'timestamptz', isNullable: true },
          { name: 'ip_address', type: 'varchar', length: '45', isNullable: true },
          { name: 'user_agent', type: 'varchar', length: '500', isNullable: true },
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
      'minor_guardian_consents',
      new TableForeignKey({
        columnNames: ['minor_user_id'],
        referencedTableName: 'user_accounts',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'minor_guardian_consents',
      new TableIndex({
        name: 'IDX_minor_guardian_consents_minor_user_id',
        columnNames: ['minor_user_id'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'minor_guardian_consents',
      new TableIndex({
        name: 'IDX_minor_guardian_consents_token_hash',
        columnNames: ['token_hash'],
        isUnique: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('minor_guardian_consents');
    await queryRunner.query(`DROP TYPE IF EXISTS "minor_guardian_consents_status_enum"`);
  }
}
