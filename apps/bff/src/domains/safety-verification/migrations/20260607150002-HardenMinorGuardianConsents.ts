import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class HardenMinorGuardianConsents20260607150002
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('minor_guardian_consents'))) return;

    const table = await queryRunner.getTable('minor_guardian_consents');
    if (!table?.findColumnByName('management_token_hash')) {
      await queryRunner.addColumn(
        'minor_guardian_consents',
        new TableColumn({
          name: 'management_token_hash',
          type: 'varchar',
          length: '64',
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName('revoked_at')) {
      await queryRunner.addColumn(
        'minor_guardian_consents',
        new TableColumn({
          name: 'revoked_at',
          type: 'timestamptz',
          isNullable: true,
        }),
      );
    }

    const refreshed = await queryRunner.getTable('minor_guardian_consents');
    if (
      refreshed &&
      !refreshed.indices.some(
        (index) => index.name === 'IDX_minor_guardian_consents_management_token_hash',
      )
    ) {
      await queryRunner.createIndex(
        'minor_guardian_consents',
        new TableIndex({
          name: 'IDX_minor_guardian_consents_management_token_hash',
          columnNames: ['management_token_hash'],
          isUnique: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (!(await queryRunner.hasTable('minor_guardian_consents'))) return;
    await queryRunner.dropIndex(
      'minor_guardian_consents',
      'IDX_minor_guardian_consents_management_token_hash',
    );
    await queryRunner.dropColumn('minor_guardian_consents', 'revoked_at');
    await queryRunner.dropColumn(
      'minor_guardian_consents',
      'management_token_hash',
    );
  }
}
