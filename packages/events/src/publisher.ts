/** Publishes domain events to a topic/channel. */
export interface EventPublisher {
  publish(topic: string, event: unknown): Promise<void>;
}

/**
 * No-op publisher for the current monolith architecture.
 * Replace with a real implementation (SQS, Redis Pub/Sub, etc.) when
 * the system moves to async event processing.
 */
export class NoOpEventPublisher implements EventPublisher {
  async publish(_topic: string, _event: unknown): Promise<void> {}
}
