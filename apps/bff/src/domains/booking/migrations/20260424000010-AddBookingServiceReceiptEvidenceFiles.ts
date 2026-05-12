import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

/**
 * Wave 2 (BFF): adds `evidence_files` JSONB column to booking_service_receipts.
 *
 * Mirrors the dispute evidence shape: an array of
 *   `{ type: 'file', key: string, id?: string }`.
 *
 * Public response DTOs sign each `key` on demand via `S3UrlPresignerService`,
 * so callers receive `{ id, key, signedUrl }` blocks. The column is nullable
 * (existing receipts populate as `null`, never `[]`) — a non-null default
 * would have hidden the difference between "no evidence yet" and "empty list".
 */
export class AddBookingServiceReceiptEvidenceFiles20260424000010
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('booking_service_receipts');
    if (!table?.findColumnByName('evidence_files')) {
      await queryRunner.addColumn(
        'booking_service_receipts',
        new TableColumn({
          name: 'evidence_files',
          type: 'jsonb',
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('booking_service_receipts', 'evidence_files');
  }
}
