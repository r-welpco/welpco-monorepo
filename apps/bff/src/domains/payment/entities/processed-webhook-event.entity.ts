import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/**
 * Tracks Stripe webhook event IDs that have been processed to prevent
 * duplicate processing on retries.
 */
@Entity('processed_webhook_events')
export class ProcessedWebhookEvent {
  @PrimaryColumn({ name: 'event_id', type: 'varchar', length: 255 })
  eventId!: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  eventType!: string;

  @CreateDateColumn({ name: 'processed_at', type: 'timestamptz' })
  processedAt!: Date;
}
