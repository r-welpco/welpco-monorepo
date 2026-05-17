import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align availability enum labels (MONDAY/DAILY) with local dev (Monday/Daily).
 * Idempotent — skips when already aligned.
 */
export class AlignAvailabilityEnumsToDevPascalCase20260517130001
  implements MigrationInterface
{
  name = 'AlignAvailabilityEnumsToDevPascalCase20260517130001';

  private readonly dayLabels = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ] as const;

  private readonly recurringLabels = ['Daily', 'Weekly', 'Monthly'] as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.alignDayOfWeekEnum(queryRunner);
    await this.alignRecurringPatternEnum(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.revertRecurringPatternEnum(queryRunner);
    await this.revertDayOfWeekEnum(queryRunner);
  }

  private async enumHasLabel(
    queryRunner: QueryRunner,
    typeName: string,
    label: string,
  ): Promise<boolean> {
    const rows = (await queryRunner.query(
      `
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      WHERE t.typname = $1 AND e.enumlabel = $2
      LIMIT 1
      `,
      [typeName, label],
    )) as unknown[];
    return rows.length > 0;
  }

  private async alignDayOfWeekEnum(queryRunner: QueryRunner): Promise<void> {
    const typeName = 'availability_calendars_day_of_week_enum';
    if (await this.enumHasLabel(queryRunner, typeName, 'Monday')) {
      return;
    }

    const newType = `${typeName}_new`;
    const enumList = this.dayLabels.map((d) => `'${d}'`).join(', ');

    await queryRunner.query(`CREATE TYPE "${newType}" AS ENUM (${enumList})`);

    await queryRunner.query(`
      ALTER TABLE "availability_calendars"
      ALTER COLUMN "day_of_week" TYPE "${newType}"
      USING (
        CASE "day_of_week"::text
          WHEN 'MONDAY' THEN 'Monday'
          WHEN 'TUESDAY' THEN 'Tuesday'
          WHEN 'WEDNESDAY' THEN 'Wednesday'
          WHEN 'THURSDAY' THEN 'Thursday'
          WHEN 'FRIDAY' THEN 'Friday'
          WHEN 'SATURDAY' THEN 'Saturday'
          WHEN 'SUNDAY' THEN 'Sunday'
          WHEN 'Monday' THEN 'Monday'
          WHEN 'Tuesday' THEN 'Tuesday'
          WHEN 'Wednesday' THEN 'Wednesday'
          WHEN 'Thursday' THEN 'Thursday'
          WHEN 'Friday' THEN 'Friday'
          WHEN 'Saturday' THEN 'Saturday'
          WHEN 'Sunday' THEN 'Sunday'
          ELSE 'Monday'
        END
      )::"${newType}"
    `);

    await queryRunner.query(`DROP TYPE "${typeName}"`);
    await queryRunner.query(`ALTER TYPE "${newType}" RENAME TO "${typeName}"`);
  }

  private async alignRecurringPatternEnum(queryRunner: QueryRunner): Promise<void> {
    const typeName = 'availability_calendars_recurring_pattern_enum';
    if (await this.enumHasLabel(queryRunner, typeName, 'Weekly')) {
      return;
    }

    const newType = `${typeName}_new`;
    const enumList = this.recurringLabels.map((d) => `'${d}'`).join(', ');

    await queryRunner.query(`CREATE TYPE "${newType}" AS ENUM (${enumList})`);

    await queryRunner.query(`
      ALTER TABLE "availability_calendars"
      ALTER COLUMN "recurring_pattern" TYPE "${newType}"
      USING (
        CASE "recurring_pattern"::text
          WHEN 'DAILY' THEN 'Daily'
          WHEN 'WEEKLY' THEN 'Weekly'
          WHEN 'MONTHLY' THEN 'Monthly'
          WHEN 'NONE' THEN 'Weekly'
          WHEN 'Daily' THEN 'Daily'
          WHEN 'Weekly' THEN 'Weekly'
          WHEN 'Monthly' THEN 'Monthly'
          ELSE 'Weekly'
        END
      )::"${newType}"
    `);

    await queryRunner.query(`DROP TYPE "${typeName}"`);
    await queryRunner.query(`ALTER TYPE "${newType}" RENAME TO "${typeName}"`);
  }

  private async revertDayOfWeekEnum(queryRunner: QueryRunner): Promise<void> {
    const typeName = 'availability_calendars_day_of_week_enum';
    if (!(await this.enumHasLabel(queryRunner, typeName, 'Monday'))) {
      return;
    }

    const newType = `${typeName}_legacy`;
    const legacy = [
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
      'SUNDAY',
    ];

    await queryRunner.query(
      `CREATE TYPE "${newType}" AS ENUM (${legacy.map((d) => `'${d}'`).join(', ')})`,
    );

    await queryRunner.query(`
      ALTER TABLE "availability_calendars"
      ALTER COLUMN "day_of_week" TYPE "${newType}"
      USING (
        CASE "day_of_week"::text
          WHEN 'Monday' THEN 'MONDAY'
          WHEN 'Tuesday' THEN 'TUESDAY'
          WHEN 'Wednesday' THEN 'WEDNESDAY'
          WHEN 'Thursday' THEN 'THURSDAY'
          WHEN 'Friday' THEN 'FRIDAY'
          WHEN 'Saturday' THEN 'SATURDAY'
          WHEN 'Sunday' THEN 'SUNDAY'
          ELSE 'MONDAY'
        END
      )::"${newType}"
    `);

    await queryRunner.query(`DROP TYPE "${typeName}"`);
    await queryRunner.query(`ALTER TYPE "${newType}" RENAME TO "${typeName}"`);
  }

  private async revertRecurringPatternEnum(queryRunner: QueryRunner): Promise<void> {
    const typeName = 'availability_calendars_recurring_pattern_enum';
    if (await this.enumHasLabel(queryRunner, typeName, 'WEEKLY')) {
      return;
    }

    const newType = `${typeName}_legacy`;
    await queryRunner.query(
      `CREATE TYPE "${newType}" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'NONE')`,
    );

    await queryRunner.query(`
      ALTER TABLE "availability_calendars"
      ALTER COLUMN "recurring_pattern" TYPE "${newType}"
      USING (
        CASE "recurring_pattern"::text
          WHEN 'Daily' THEN 'DAILY'
          WHEN 'Weekly' THEN 'WEEKLY'
          WHEN 'Monthly' THEN 'MONTHLY'
          ELSE 'WEEKLY'
        END
      )::"${newType}"
    `);

    await queryRunner.query(`DROP TYPE "${typeName}"`);
    await queryRunner.query(`ALTER TYPE "${newType}" RENAME TO "${typeName}"`);
  }
}
