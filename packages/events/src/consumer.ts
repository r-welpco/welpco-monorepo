/** Subscribes to domain events from a topic/channel. */
export interface EventConsumer {
  subscribe(topic: string, handler: (event: unknown) => Promise<void>): Promise<void>;
}

/**
 * No-op consumer for the current monolith architecture.
 * Replace with a real implementation when the system moves to async
 * event processing.
 */
export class NoOpEventConsumer implements EventConsumer {
  async subscribe(_topic: string, _handler: (event: unknown) => Promise<void>): Promise<void> {}
}
