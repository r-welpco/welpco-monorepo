import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { StripeOperationsService } from '../domains/payment/stripe-operations.service';

type IdRow = { id: string };

function parseLimit(): number {
  const value = process.argv.find((arg) => arg.startsWith('--limit='))?.split('=')[1];
  const parsed = Number(value ?? 500);
  return Number.isFinite(parsed) ? Math.min(Math.max(Math.trunc(parsed), 1), 5000) : 500;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const limit = parseLimit();
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });

  try {
    const dataSource = app.get(DataSource);
    const operations = app.get(StripeOperationsService);
    const bookingRows = (await dataSource.query(
      `SELECT DISTINCT booking_id AS id
       FROM booking_payments
       WHERE captured_at IS NOT NULL
       ORDER BY booking_id
       LIMIT $1`,
      [limit],
    )) as IdRow[];
    const transferRows = (await dataSource.query(
      `SELECT DISTINCT stripe_transfer_id AS id
       FROM welper_payout_ledger
       WHERE stripe_transfer_id IS NOT NULL
       ORDER BY stripe_transfer_id
       LIMIT $1`,
      [limit],
    )) as IdRow[];

    const summary = {
      mode: apply ? 'apply' : 'dry-run',
      capturedBookings: bookingRows.length,
      transfers: transferRows.length,
      reconciledBookings: 0,
      reconciledTransfers: 0,
      tax: null as Awaited<ReturnType<StripeOperationsService['retryPendingTaxTransactions']>> | null,
      exceptions: [] as Array<{ scope: string; id: string; message: string }>,
    };

    if (apply) {
      for (const row of bookingRows) {
        try {
          await operations.reconcileBookingRefunds(row.id);
          summary.reconciledBookings += 1;
        } catch (err) {
          summary.exceptions.push({
            scope: 'booking',
            id: row.id,
            message: (err as Error).message,
          });
        }
      }
      for (const row of transferRows) {
        try {
          await operations.reconcileTransferById(row.id);
          summary.reconciledTransfers += 1;
        } catch (err) {
          summary.exceptions.push({
            scope: 'transfer',
            id: row.id,
            message: (err as Error).message,
          });
        }
      }
      summary.tax = await operations.retryPendingTaxTransactions(limit);
    }

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    if (summary.exceptions.length > 0) process.exitCode = 2;
  } finally {
    await app.close();
  }
}

void main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
