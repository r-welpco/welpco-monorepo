import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveDefaultHourlyRateAddExperienceToOfferings20260119000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add experience_years column to service_offerings (nullable initially)
    const serviceOfferingsTable = await queryRunner.getTable('service_offerings');
    const hasExperienceYears = serviceOfferingsTable?.findColumnByName('experience_years');
    
    if (!hasExperienceYears) {
      await queryRunner.addColumn(
        'service_offerings',
        new TableColumn({
          name: 'experience_years',
          type: 'integer',
          isNullable: true,
        }),
      );
    }

    // Step 2: Set default experience_years = 1 for existing offerings
    await queryRunner.query(`
      UPDATE service_offerings 
      SET experience_years = 1 
      WHERE experience_years IS NULL
    `);

    // Step 3: Make experience_years NOT NULL
    await queryRunner.query(`
      ALTER TABLE service_offerings 
      ALTER COLUMN experience_years SET NOT NULL
    `);

    // Step 4: Set default hourly_rate for any NULL values (use 25.00 as default)
    await queryRunner.query(`
      UPDATE service_offerings 
      SET hourly_rate = 25.00 
      WHERE hourly_rate IS NULL
    `);

    // Step 5: Make hourly_rate NOT NULL
    await queryRunner.query(`
      ALTER TABLE service_offerings 
      ALTER COLUMN hourly_rate SET NOT NULL
    `);

    // Step 6: Remove default_hourly_rate column from welper_profiles
    const welperProfilesTable = await queryRunner.getTable('welper_profiles');
    const hasDefaultHourlyRate = welperProfilesTable?.findColumnByName('default_hourly_rate');
    
    if (hasDefaultHourlyRate) {
      await queryRunner.dropColumn('welper_profiles', 'default_hourly_rate');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add back default_hourly_rate column to welper_profiles
    const welperProfilesTable = await queryRunner.getTable('welper_profiles');
    const hasDefaultHourlyRate = welperProfilesTable?.findColumnByName('default_hourly_rate');
    
    if (!hasDefaultHourlyRate) {
      await queryRunner.addColumn(
        'welper_profiles',
        new TableColumn({
          name: 'default_hourly_rate',
          type: 'decimal',
          precision: 10,
          scale: 2,
          isNullable: false,
          default: 25.00,
        }),
      );
    }

    // Step 2: Make hourly_rate nullable again
    await queryRunner.query(`
      ALTER TABLE service_offerings 
      ALTER COLUMN hourly_rate DROP NOT NULL
    `);

    // Step 3: Remove experience_years column from service_offerings
    const serviceOfferingsTable = await queryRunner.getTable('service_offerings');
    const hasExperienceYears = serviceOfferingsTable?.findColumnByName('experience_years');
    
    if (hasExperienceYears) {
      await queryRunner.dropColumn('service_offerings', 'experience_years');
    }
  }
}
