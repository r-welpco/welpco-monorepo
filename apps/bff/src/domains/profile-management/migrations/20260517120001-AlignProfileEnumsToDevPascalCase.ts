import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Align profile enums on DBs created from InitialSchema (INCOMPLETE/PUBLIC)
 * with local dev (Incomplete/Public). Idempotent — skips when already aligned.
 */
export class AlignProfileEnumsToDevPascalCase20260517120001 implements MigrationInterface {
  name = 'AlignProfileEnumsToDevPascalCase20260517120001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.alignCompletionEnum(
      queryRunner,
      'welper_profiles',
      'welper_profiles_profile_completion_status_enum',
    );
    await this.alignCompletionEnum(
      queryRunner,
      'customer_profiles',
      'customer_profiles_profile_completion_status_enum',
    );
    await this.alignVisibilityEnum(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.revertVisibilityEnum(queryRunner);
    await this.revertCompletionEnum(
      queryRunner,
      'welper_profiles',
      'welper_profiles_profile_completion_status_enum',
    );
    await this.revertCompletionEnum(
      queryRunner,
      'customer_profiles',
      'customer_profiles_profile_completion_status_enum',
    );
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

  private async alignCompletionEnum(
    queryRunner: QueryRunner,
    tableName: string,
    typeName: string,
  ): Promise<void> {
    if (await this.enumHasLabel(queryRunner, typeName, 'Incomplete')) {
      return;
    }

    const newType = `${typeName}_new`;

    await queryRunner.query(`
      CREATE TYPE "${newType}" AS ENUM ('Incomplete', 'Complete')
    `);

    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "profile_completion_status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "profile_completion_status" TYPE "${newType}"
      USING (
        CASE "profile_completion_status"::text
          WHEN 'INCOMPLETE' THEN 'Incomplete'
          WHEN 'COMPLETE' THEN 'Complete'
          WHEN 'PENDING_REVIEW' THEN 'Incomplete'
          WHEN 'Incomplete' THEN 'Incomplete'
          WHEN 'Complete' THEN 'Complete'
          ELSE 'Incomplete'
        END
      )::"${newType}"
    `);

    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "profile_completion_status" SET DEFAULT 'Incomplete'
    `);

    await queryRunner.query(`DROP TYPE "${typeName}"`);
    await queryRunner.query(`ALTER TYPE "${newType}" RENAME TO "${typeName}"`);
  }

  private async alignVisibilityEnum(queryRunner: QueryRunner): Promise<void> {
    const typeName = 'welper_profiles_profile_visibility_enum';
    if (await this.enumHasLabel(queryRunner, typeName, 'Public')) {
      return;
    }

    if (await this.enumHasLabel(queryRunner, typeName, 'PUBLIC')) {
      await queryRunner.query(`
        ALTER TYPE "${typeName}" RENAME VALUE 'PUBLIC' TO 'Public'
      `);
    }
    if (await this.enumHasLabel(queryRunner, typeName, 'PRIVATE')) {
      await queryRunner.query(`
        ALTER TYPE "${typeName}" RENAME VALUE 'PRIVATE' TO 'Private'
      `);
    }

    await queryRunner.query(`
      ALTER TABLE "welper_profiles"
      ALTER COLUMN "profile_visibility" SET DEFAULT 'Public'
    `);
  }

  private async revertCompletionEnum(
    queryRunner: QueryRunner,
    tableName: string,
    typeName: string,
  ): Promise<void> {
    if (!(await this.enumHasLabel(queryRunner, typeName, 'Incomplete'))) {
      return;
    }

    const newType = `${typeName}_legacy`;

    await queryRunner.query(`
      CREATE TYPE "${newType}" AS ENUM ('INCOMPLETE', 'PENDING_REVIEW', 'COMPLETE')
    `);

    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "profile_completion_status" DROP DEFAULT
    `);

    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "profile_completion_status" TYPE "${newType}"
      USING (
        CASE "profile_completion_status"::text
          WHEN 'Incomplete' THEN 'INCOMPLETE'
          WHEN 'Complete' THEN 'COMPLETE'
          ELSE 'INCOMPLETE'
        END
      )::"${newType}"
    `);

    await queryRunner.query(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "profile_completion_status" SET DEFAULT 'INCOMPLETE'
    `);

    await queryRunner.query(`DROP TYPE "${typeName}"`);
    await queryRunner.query(`ALTER TYPE "${newType}" RENAME TO "${typeName}"`);
  }

  private async revertVisibilityEnum(queryRunner: QueryRunner): Promise<void> {
    const typeName = 'welper_profiles_profile_visibility_enum';
    if (await this.enumHasLabel(queryRunner, typeName, 'PUBLIC')) {
      return;
    }
    if (await this.enumHasLabel(queryRunner, typeName, 'Public')) {
      await queryRunner.query(`
        ALTER TYPE "${typeName}" RENAME VALUE 'Public' TO 'PUBLIC'
      `);
    }
    if (await this.enumHasLabel(queryRunner, typeName, 'Private')) {
      await queryRunner.query(`
        ALTER TYPE "${typeName}" RENAME VALUE 'Private' TO 'PRIVATE'
      `);
    }
    await queryRunner.query(`
      ALTER TABLE "welper_profiles"
      ALTER COLUMN "profile_visibility" SET DEFAULT 'PUBLIC'
    `);
  }
}
