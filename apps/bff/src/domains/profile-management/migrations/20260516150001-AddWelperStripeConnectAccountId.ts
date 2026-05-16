import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddWelperStripeConnectAccountId20260516150001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'welper_profiles',
      new TableColumn({
        name: 'stripe_connect_account_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'stripe_connect_account_id');
  }
}
