import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class InitialContentManagementSchema20260119000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Service Categories Table
    await queryRunner.createTable(
      new Table({
        name: 'service_categories',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'parent_id',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'level',
            type: 'integer',
            default: 1,
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'icon',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign key for parent category
    await queryRunner.createForeignKey(
      'service_categories',
      new TableForeignKey({
        columnNames: ['parent_id'],
        referencedTableName: 'service_categories',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    // Add indexes
    await queryRunner.createIndex(
      'service_categories',
      new TableIndex({
        name: 'IDX_service_categories_parent_id',
        columnNames: ['parent_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_categories',
      new TableIndex({
        name: 'IDX_service_categories_level',
        columnNames: ['level'],
      }),
    );

    await queryRunner.createIndex(
      'service_categories',
      new TableIndex({
        name: 'IDX_service_categories_is_active',
        columnNames: ['is_active'],
      }),
    );

    // Questions Table
    await queryRunner.createTable(
      new Table({
        name: 'questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['text', 'number', 'date', 'time', 'choice', 'boolean', 'entity_reference'],
          },
          {
            name: 'label',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'placeholder',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'help_text',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'validation_rules',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'options',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'entity_type',
            type: 'enum',
            enum: ['child', 'person', 'pet'],
            isNullable: true,
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for questions
    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_questions_type',
        columnNames: ['type'],
      }),
    );

    await queryRunner.createIndex(
      'questions',
      new TableIndex({
        name: 'IDX_questions_entity_type',
        columnNames: ['entity_type'],
      }),
    );

    // Service Questions Table (Link Table)
    await queryRunner.createTable(
      new Table({
        name: 'service_questions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'service_category_id',
            type: 'uuid',
          },
          {
            name: 'question_id',
            type: 'uuid',
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'is_required',
            type: 'boolean',
            default: true,
          },
          {
            name: 'conditional_logic',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add foreign keys for service_questions
    await queryRunner.createForeignKey(
      'service_questions',
      new TableForeignKey({
        columnNames: ['service_category_id'],
        referencedTableName: 'service_categories',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'service_questions',
      new TableForeignKey({
        columnNames: ['question_id'],
        referencedTableName: 'questions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    // Add indexes for service_questions
    await queryRunner.createIndex(
      'service_questions',
      new TableIndex({
        name: 'IDX_service_questions_service_category_id',
        columnNames: ['service_category_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_questions',
      new TableIndex({
        name: 'IDX_service_questions_question_id',
        columnNames: ['question_id'],
      }),
    );

    await queryRunner.createIndex(
      'service_questions',
      new TableIndex({
        name: 'IDX_service_questions_category_display_order',
        columnNames: ['service_category_id', 'display_order'],
      }),
    );

    // Static Content Table
    await queryRunner.createTable(
      new Table({
        name: 'static_content',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content_type',
            type: 'enum',
            enum: ['about_us', 'faq', 'terms', 'privacy', 'contact', 'homepage'],
          },
          {
            name: 'title',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'body',
            type: 'text',
          },
          {
            name: 'version',
            type: 'integer',
            default: 1,
          },
          {
            name: 'is_published',
            type: 'boolean',
            default: true,
          },
          {
            name: 'published_date',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for static_content
    await queryRunner.createIndex(
      'static_content',
      new TableIndex({
        name: 'IDX_static_content_content_type',
        columnNames: ['content_type'],
      }),
    );

    await queryRunner.createIndex(
      'static_content',
      new TableIndex({
        name: 'IDX_static_content_is_published',
        columnNames: ['is_published'],
      }),
    );

    // FAQ Items Table
    await queryRunner.createTable(
      new Table({
        name: 'faq_items',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'category',
            type: 'enum',
            enum: ['customer', 'welper', 'general'],
          },
          {
            name: 'question',
            type: 'text',
          },
          {
            name: 'answer',
            type: 'text',
          },
          {
            name: 'display_order',
            type: 'integer',
            default: 0,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for faq_items
    await queryRunner.createIndex(
      'faq_items',
      new TableIndex({
        name: 'IDX_faq_items_category',
        columnNames: ['category'],
      }),
    );

    await queryRunner.createIndex(
      'faq_items',
      new TableIndex({
        name: 'IDX_faq_items_is_active',
        columnNames: ['is_active'],
      }),
    );

    // Marketing Phrases Table
    await queryRunner.createTable(
      new Table({
        name: 'marketing_phrases',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'phrase_text',
            type: 'text',
          },
          {
            name: 'phrase_type',
            type: 'enum',
            enum: ['cta', 'slogan', 'tagline'],
          },
          {
            name: 'usage_context',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Add indexes for marketing_phrases
    await queryRunner.createIndex(
      'marketing_phrases',
      new TableIndex({
        name: 'IDX_marketing_phrases_phrase_type',
        columnNames: ['phrase_type'],
      }),
    );

    await queryRunner.createIndex(
      'marketing_phrases',
      new TableIndex({
        name: 'IDX_marketing_phrases_usage_context',
        columnNames: ['usage_context'],
      }),
    );

    await queryRunner.createIndex(
      'marketing_phrases',
      new TableIndex({
        name: 'IDX_marketing_phrases_is_active',
        columnNames: ['is_active'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.dropTable('marketing_phrases', true);
    await queryRunner.dropTable('faq_items', true);
    await queryRunner.dropTable('static_content', true);
    await queryRunner.dropTable('service_questions', true);
    await queryRunner.dropTable('questions', true);
    await queryRunner.dropTable('service_categories', true);
  }
}
