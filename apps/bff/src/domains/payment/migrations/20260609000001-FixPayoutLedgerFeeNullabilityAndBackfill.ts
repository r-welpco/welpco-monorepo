import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixPayoutLedgerFeeNullabilityAndBackfill20260609000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "welper_payout_ledger"
      ALTER COLUMN "stripe_fee_cents" DROP NOT NULL,
      ALTER COLUMN "stripe_fee_cents" DROP DEFAULT
    `);

    await queryRunner.query(`
      WITH payment_totals AS (
        SELECT
          "booking_id",
          SUM(COALESCE("captured_amount_cents", "amount_cents"))::integer AS "captured_cents",
          BOOL_AND(
            "stripe_fee_cents" IS NOT NULL
            AND "stripe_balance_transaction_id" IS NOT NULL
          ) AS "fees_synced",
          SUM(COALESCE("stripe_fee_cents", 0))::integer AS "stripe_fee_cents"
        FROM "booking_payments"
        WHERE
          "captured_at" IS NOT NULL
          AND "payment_kind" IN ('hold', 'delta_receipt')
        GROUP BY "booking_id"
      )
      INSERT INTO "welper_payout_ledger" (
        "booking_id",
        "welper_id",
        "customer_id",
        "payment_released_at",
        "customer_subtotal_cents",
        "customer_tax_cents",
        "customer_total_cents",
        "welper_gross_cents",
        "welper_refund_cents",
        "welper_net_cents",
        "platform_gross_cents",
        "stripe_fee_cents",
        "status",
        "exclusion_reason"
      )
      SELECT
        booking."id",
        booking."welper_id",
        booking."customer_id",
        booking."payment_released_at",
        receipt."subtotal_cents",
        receipt."tax_cents",
        receipt."total_cents",
        ROUND(receipt."subtotal_cents" * 0.8)::integer,
        0,
        ROUND(receipt."subtotal_cents" * 0.8)::integer,
        receipt."subtotal_cents" - ROUND(receipt."subtotal_cents" * 0.8)::integer,
        CASE WHEN totals."fees_synced" THEN totals."stripe_fee_cents" ELSE NULL END,
        CASE WHEN totals."fees_synced" THEN 'pending' ELSE 'excluded' END,
        CASE WHEN totals."fees_synced" THEN NULL ELSE 'stripe_fee_pending' END
      FROM "booking_requests" booking
      INNER JOIN "booking_service_receipts" receipt
        ON receipt."booking_id" = booking."id"
      INNER JOIN payment_totals totals
        ON totals."booking_id" = booking."id"
      LEFT JOIN "welper_payout_ledger" ledger
        ON ledger."booking_id" = booking."id"
      WHERE
        booking."status" = 'payment_released'
        AND booking."payment_released_at" IS NOT NULL
        AND ledger."id" IS NULL
        AND totals."captured_cents" >= receipt."total_cents"
        AND NOT EXISTS (
          SELECT 1
          FROM "booking_payments" unsettled
          WHERE
            unsettled."booking_id" = booking."id"
            AND unsettled."payment_kind" IN ('hold', 'delta_receipt')
            AND unsettled."status" IN ('pending', 'requires_action', 'authorized', 'failed')
        )
      ON CONFLICT ("booking_id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "welper_payout_ledger"
      SET "stripe_fee_cents" = 0
      WHERE "stripe_fee_cents" IS NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "welper_payout_ledger"
      ALTER COLUMN "stripe_fee_cents" SET DEFAULT 0,
      ALTER COLUMN "stripe_fee_cents" SET NOT NULL
    `);
  }
}
