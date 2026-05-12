import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateChatThreadsAndMessages20260316000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'chat_threads',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
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
          {
            name: 'booking_id',
            type: 'uuid',
            isUnique: true,
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'chat_threads',
      new TableIndex({
        name: 'IDX_chat_threads_booking_id',
        columnNames: ['booking_id'],
      }),
    );

    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
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
          {
            name: 'chat_thread_id',
            type: 'uuid',
          },
          {
            name: 'sender_id',
            type: 'uuid',
          },
          {
            name: 'content',
            type: 'text',
          },
        ],
      }),
      true,
    );

    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_chat_thread_id',
        columnNames: ['chat_thread_id'],
      }),
    );
    await queryRunner.createIndex(
      'messages',
      new TableIndex({
        name: 'IDX_messages_sender_id',
        columnNames: ['sender_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('messages', 'IDX_messages_sender_id');
    await queryRunner.dropIndex('messages', 'IDX_messages_chat_thread_id');
    await queryRunner.dropTable('messages');
    await queryRunner.dropIndex('chat_threads', 'IDX_chat_threads_booking_id');
    await queryRunner.dropTable('chat_threads');
  }
}
