import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Wave 2 (BFF): adds two-sided server-side read cursors to `chat_threads`.
 *
 * - `last_read_at_customer` — when the customer last opened the thread.
 * - `last_read_at_welper`   — when the welper last opened the thread.
 *
 * Both default to NULL (never read) — bible §22.6: "lastReadAt defaulting to
 * NULL (never read) matters." Auto-backfilling to thread creation time would
 * have hidden every existing unread message; existing customers/welpers will
 * see correct unread state on their next visit.
 *
 * The chat is two-sided so each participant carries an independent cursor.
 * The DTO returned to a given user only carries that user's cursor (the
 * other party's cursor is private metadata, not exposed).
 */
export class AddChatThreadLastReadAt20260424000020 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('chat_threads');
    if (!table?.findColumnByName('last_read_at_customer')) {
      await queryRunner.addColumn(
        'chat_threads',
        new TableColumn({
          name: 'last_read_at_customer',
          type: 'timestamptz',
          isNullable: true,
        }),
      );
    }
    if (!table?.findColumnByName('last_read_at_welper')) {
      await queryRunner.addColumn(
        'chat_threads',
        new TableColumn({
          name: 'last_read_at_welper',
          type: 'timestamptz',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('chat_threads', 'last_read_at_welper');
    await queryRunner.dropColumn('chat_threads', 'last_read_at_customer');
  }
}
