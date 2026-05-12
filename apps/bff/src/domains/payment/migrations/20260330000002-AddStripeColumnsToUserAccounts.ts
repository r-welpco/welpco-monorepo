import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStripeColumnsToUserAccounts20260330000002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'user_accounts',
      new TableColumn({
        name: 'stripe_customer_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
    await queryRunner.addColumn(
      'user_accounts',
      new TableColumn({
        name: 'stripe_default_payment_method_id',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('user_accounts', 'stripe_default_payment_method_id');
    await queryRunner.dropColumn('user_accounts', 'stripe_customer_id');
  }
}
