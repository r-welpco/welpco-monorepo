import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOnboardingCompletedToUserAccount1735689600000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (!table || table.findColumnByName('onboarding_completed')) {
      return;
    }
    await queryRunner.addColumn(
      'user_accounts',
      new TableColumn({
        name: 'onboarding_completed',
        type: 'boolean',
        default: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user_accounts');
    if (table?.findColumnByName('onboarding_completed')) {
      await queryRunner.dropColumn('user_accounts', 'onboarding_completed');
    }
  }
}

