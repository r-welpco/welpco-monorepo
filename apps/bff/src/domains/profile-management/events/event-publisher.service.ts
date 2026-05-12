import { Injectable, Logger } from '@nestjs/common';

export interface ProfileCreatedEvent {
  profileId: string;
  customerId?: string;
  welperId?: string;
  profileType: 'customer' | 'welper';
  timestamp: string;
}

export interface ProfileUpdatedEvent {
  profileId: string;
  customerId?: string;
  welperId?: string;
  profileType: 'customer' | 'welper';
  timestamp: string;
}

export interface ServiceOfferingAddedEvent {
  serviceOfferingId: string;
  welperId: string;
  serviceCategoryId: string;
  timestamp: string;
}

export interface AvailabilityUpdatedEvent {
  welperId: string;
  timestamp: string;
}

export interface FavoriteWelperAddedEvent {
  customerId: string;
  welperId: string;
  timestamp: string;
}

/**
 * No-op event publisher (Kafka removed; synchronous flow used).
 */
@Injectable()
export class EventPublisherService {
  private readonly logger = new Logger(EventPublisherService.name);

  async publishProfileCreated(_event: ProfileCreatedEvent): Promise<void> {}

  async publishProfileUpdated(_event: ProfileUpdatedEvent): Promise<void> {}

  async publishServiceOfferingAdded(
    _event: ServiceOfferingAddedEvent,
  ): Promise<void> {}

  async publishAvailabilityUpdated(
    _event: AvailabilityUpdatedEvent,
  ): Promise<void> {}

  async publishFavoriteWelperAdded(
    _event: FavoriteWelperAddedEvent,
  ): Promise<void> {}
}
