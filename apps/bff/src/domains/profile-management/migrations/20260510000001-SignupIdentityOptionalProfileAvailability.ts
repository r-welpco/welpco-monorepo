import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Signup audit (2026-05-10): persist identity compliance fields, optional-profile
 * step completion (including explicit skip), and welper ad-hoc-only availability.
 */
export class SignupIdentityOptionalProfileAvailability20260510000001
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const addCustomerColumn = async (name: string, column: TableColumn) => {
      const t = await queryRunner.getTable('customer_profiles');
      if (!t?.findColumnByName(name)) {
        await queryRunner.addColumn('customer_profiles', column);
      }
    };
    const addWelperColumn = async (name: string, column: TableColumn) => {
      const t = await queryRunner.getTable('welper_profiles');
      if (!t?.findColumnByName(name)) {
        await queryRunner.addColumn('welper_profiles', column);
      }
    };

    await addCustomerColumn(
      'date_of_birth',
      new TableColumn({
        name: 'date_of_birth',
        type: 'date',
        isNullable: true,
      }),
    );
    await addCustomerColumn(
      'tos_accepted_at',
      new TableColumn({
        name: 'tos_accepted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
    await addCustomerColumn(
      'privacy_accepted_at',
      new TableColumn({
        name: 'privacy_accepted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
    await addCustomerColumn(
      'optional_profile_step_completed_at',
      new TableColumn({
        name: 'optional_profile_step_completed_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );

    await addWelperColumn(
      'date_of_birth',
      new TableColumn({
        name: 'date_of_birth',
        type: 'date',
        isNullable: true,
      }),
    );
    await addWelperColumn(
      'tos_accepted_at',
      new TableColumn({
        name: 'tos_accepted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
    await addWelperColumn(
      'privacy_accepted_at',
      new TableColumn({
        name: 'privacy_accepted_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
    await addWelperColumn(
      'optional_profile_step_completed_at',
      new TableColumn({
        name: 'optional_profile_step_completed_at',
        type: 'timestamptz',
        isNullable: true,
      }),
    );
    await addWelperColumn(
      'availability_ad_hoc_only',
      new TableColumn({
        name: 'availability_ad_hoc_only',
        type: 'boolean',
        default: false,
        isNullable: false,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const welper = await queryRunner.getTable('welper_profiles');
    if (welper?.findColumnByName('availability_ad_hoc_only')) {
      await queryRunner.dropColumn('welper_profiles', 'availability_ad_hoc_only');
    }
    if (welper?.findColumnByName('optional_profile_step_completed_at')) {
      await queryRunner.dropColumn(
        'welper_profiles',
        'optional_profile_step_completed_at',
      );
    }
    if (welper?.findColumnByName('privacy_accepted_at')) {
      await queryRunner.dropColumn('welper_profiles', 'privacy_accepted_at');
    }
    if (welper?.findColumnByName('tos_accepted_at')) {
      await queryRunner.dropColumn('welper_profiles', 'tos_accepted_at');
    }
    if (welper?.findColumnByName('date_of_birth')) {
      await queryRunner.dropColumn('welper_profiles', 'date_of_birth');
    }

    const customer = await queryRunner.getTable('customer_profiles');
    if (customer?.findColumnByName('optional_profile_step_completed_at')) {
      await queryRunner.dropColumn(
        'customer_profiles',
        'optional_profile_step_completed_at',
      );
    }
    if (customer?.findColumnByName('privacy_accepted_at')) {
      await queryRunner.dropColumn('customer_profiles', 'privacy_accepted_at');
    }
    if (customer?.findColumnByName('tos_accepted_at')) {
      await queryRunner.dropColumn('customer_profiles', 'tos_accepted_at');
    }
    if (customer?.findColumnByName('date_of_birth')) {
      await queryRunner.dropColumn('customer_profiles', 'date_of_birth');
    }
  }
}
