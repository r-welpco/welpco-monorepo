import { Injectable, Logger } from '@nestjs/common';

/**
 * No-op event publisher (Kafka removed).
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  async publishContentUpdated(_event: any): Promise<void> {}
}
