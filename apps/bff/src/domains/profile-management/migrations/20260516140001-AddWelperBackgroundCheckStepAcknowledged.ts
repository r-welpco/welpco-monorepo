import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Background check payment/Certn can complete while the user is on Stripe Checkout.
 * Acknowledgment ensures the wizard stays on the background-check step until they
 * explicitly continue (see signup orchestrator).
 */
export class AddWelperBackgroundCheckStepAcknowledged20260516140001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('background_check_step_acknowledged_at')) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'background_check_step_acknowledged_at',
          type: 'timestamptz',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (table?.findColumnByName('background_check_step_acknowledged_at')) {
      await queryRunner.dropColumn(
        'welper_profiles',
        'background_check_step_acknowledged_at',
      );
    }
  }
}
