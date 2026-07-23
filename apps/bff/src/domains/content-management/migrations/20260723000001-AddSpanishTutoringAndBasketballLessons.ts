import { MigrationInterface, QueryRunner } from 'typeorm';

type CategoryRow = { id: string };

type ServiceQuestionRow = {
  question_id: string;
  display_order: number;
  is_required: boolean;
  conditional_logic: unknown;
};

/**
 * Adds Learning & Lessons subcategories:
 * - Spanish Tutoring (same questions as French Tutoring)
 * - Basketball Lessons (same questions as Swimming Lessons)
 *
 * Safe for prod/staging/dev: additive only, idempotent, no business-data deletes.
 * Reuses existing `questions` rows via `service_questions` link copies.
 */
export class AddSpanishTutoringAndBasketballLessons20260723000001
  implements MigrationInterface
{
  name = 'AddSpanishTutoringAndBasketballLessons20260723000001';

  private readonly learningSubcategories = [
    'Math Tutoring',
    'French Tutoring',
    'Spanish Tutoring',
    'English Tutoring',
    'Music Lessons',
    'Cooking Lessons',
    'Swimming Lessons',
    'Basketball Lessons',
  ] as const;

  public async up(queryRunner: QueryRunner): Promise<void> {
    const parentId = await this.requireParentId(queryRunner, 'Learning & Lessons');

    await this.ensureSubcategory(queryRunner, parentId, 'Spanish Tutoring');
    await this.ensureSubcategory(queryRunner, parentId, 'Basketball Lessons');
    await this.alignLearningDisplayOrders(queryRunner, parentId);

    await this.copyServiceQuestions(
      queryRunner,
      'French Tutoring',
      'Spanish Tutoring',
    );
    await this.copyServiceQuestions(
      queryRunner,
      'Swimming Lessons',
      'Basketball Lessons',
    );
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Additive taxonomy/content change — no automatic rollback.
  }

  private async requireParentId(
    queryRunner: QueryRunner,
    name: string,
  ): Promise<string> {
    const rows = (await queryRunner.query(
      `SELECT id FROM service_categories
       WHERE name = $1 AND level = 1 AND parent_id IS NULL
       LIMIT 1`,
      [name],
    )) as CategoryRow[];
    const id = rows[0]?.id;
    if (!id) {
      throw new Error(`Parent category "${name}" not found`);
    }
    return id;
  }

  private async ensureSubcategory(
    queryRunner: QueryRunner,
    parentId: string,
    name: string,
  ): Promise<string> {
    const existing = (await queryRunner.query(
      `SELECT id FROM service_categories
       WHERE name = $1 AND level = 2
       LIMIT 1`,
      [name],
    )) as CategoryRow[];

    if (existing[0]?.id) {
      await queryRunner.query(
        `UPDATE service_categories
         SET parent_id = $2,
             level = 2,
             is_active = true,
             description = COALESCE(NULLIF(description, ''), $3),
             updated_at = NOW()
         WHERE id = $1`,
        [existing[0].id, parentId, `${name} services`],
      );
      return existing[0].id;
    }

    const inserted = (await queryRunner.query(
      `INSERT INTO service_categories (
         id, name, description, parent_id, level, display_order, is_active,
         created_at, updated_at
       ) VALUES (
         uuid_generate_v4(), $1, $2, $3, 2, 0, true, NOW(), NOW()
       )
       RETURNING id`,
      [name, `${name} services`, parentId],
    )) as CategoryRow[];

    return inserted[0]!.id;
  }

  private async alignLearningDisplayOrders(
    queryRunner: QueryRunner,
    parentId: string,
  ): Promise<void> {
    for (let i = 0; i < this.learningSubcategories.length; i += 1) {
      const name = this.learningSubcategories[i]!;
      await queryRunner.query(
        `UPDATE service_categories
         SET display_order = $3,
             parent_id = $2,
             is_active = true,
             updated_at = NOW()
         WHERE name = $1 AND level = 2`,
        [name, parentId, i + 1],
      );
    }
  }

  private async copyServiceQuestions(
    queryRunner: QueryRunner,
    sourceName: string,
    targetName: string,
  ): Promise<void> {
    const sourceId = await this.requireActiveSubcategoryId(queryRunner, sourceName);
    const targetId = await this.requireActiveSubcategoryId(queryRunner, targetName);

    const sourceLinks = (await queryRunner.query(
      `SELECT question_id, display_order, is_required, conditional_logic
       FROM service_questions
       WHERE service_category_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [sourceId],
    )) as ServiceQuestionRow[];

    if (sourceLinks.length === 0) {
      throw new Error(
        `Cannot copy questions: source subcategory "${sourceName}" has no service_questions`,
      );
    }

    const targetLinks = (await queryRunner.query(
      `SELECT question_id, display_order, is_required
       FROM service_questions
       WHERE service_category_id = $1
       ORDER BY display_order ASC, created_at ASC`,
      [targetId],
    )) as Array<{
      question_id: string;
      display_order: number;
      is_required: boolean;
    }>;

    const sourceSig = sourceLinks
      .map((l) => `${l.question_id}:${l.display_order}:${l.is_required}`)
      .join('|');
    const targetSig = targetLinks
      .map((l) => `${l.question_id}:${l.display_order}:${l.is_required}`)
      .join('|');
    if (sourceSig === targetSig) {
      return;
    }

    // Only removes link rows for the new target subcategory (not questions themselves).
    await queryRunner.query(
      `DELETE FROM service_questions WHERE service_category_id = $1`,
      [targetId],
    );

    for (const link of sourceLinks) {
      await queryRunner.query(
        `INSERT INTO service_questions (
           id, service_category_id, question_id, display_order, is_required,
           conditional_logic, created_at, updated_at
         ) VALUES (
           uuid_generate_v4(), $1, $2, $3, $4, $5::jsonb, NOW(), NOW()
         )`,
        [
          targetId,
          link.question_id,
          link.display_order,
          link.is_required,
          link.conditional_logic == null
            ? null
            : JSON.stringify(link.conditional_logic),
        ],
      );
    }
  }

  private async requireActiveSubcategoryId(
    queryRunner: QueryRunner,
    name: string,
  ): Promise<string> {
    const rows = (await queryRunner.query(
      `SELECT id FROM service_categories
       WHERE name = $1 AND level = 2 AND is_active = true
       LIMIT 1`,
      [name],
    )) as CategoryRow[];
    const id = rows[0]?.id;
    if (!id) {
      throw new Error(`Active subcategory "${name}" not found`);
    }
    return id;
  }
}
