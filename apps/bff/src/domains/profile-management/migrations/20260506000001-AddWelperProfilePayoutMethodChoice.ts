import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Day 15 follow-up #2 (Phase 1 BFF agent's TODO list, finally landed).
 *
 * Adds `welper_profiles.payout_method_choice` so the signup orchestrator's
 * `submitWelperPayoutStep` can persist the welper's choice and `getState`
 * can mark the step complete.
 *
 * Without this column, the welper-payout step was a no-op write — the
 * orchestrator returned `getState` unchanged, `nextStep` stayed
 * `welperPayout`, and the wizard re-routed the user to the same step in a
 * loop. User-visible bug as of 2026-05-06.
 *
 * Values per `payout-method-choice.enum.ts`: `stripe` | `skipped`. NULL
 * means "step not yet visited."
 */
export class AddWelperProfilePayoutMethodChoice20260506000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('welper_profiles');
    if (!table?.findColumnByName('payout_method_choice')) {
      // Use a Postgres enum type so the column shape matches the entity's
      // @Column({ type: 'enum', enum: PayoutMethodChoice }) declaration.
      await queryRunner.query(
        `CREATE TYPE "welper_profiles_payout_method_choice_enum" AS ENUM ('stripe', 'skipped')`,
      );
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'payout_method_choice',
          type: 'enum',
          enum: ['stripe', 'skipped'],
          enumName: 'welper_profiles_payout_method_choice_enum',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('welper_profiles', 'payout_method_choice');
    await queryRunner.query(
      `DROP TYPE IF EXISTS "welper_profiles_payout_method_choice_enum"`,
    );
  }
}
