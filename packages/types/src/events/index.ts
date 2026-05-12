// Event types
export interface BaseEvent {
  eventId: string;
  eventType: string;
  timestamp: string;
  source: string;
}

// --- User events ---

export interface UserCreatedEvent extends BaseEvent {
  eventType: 'user.created';
  userId: string;
  userRole: string;
}

// --- Booking events ---

export interface BookingCreatedEvent extends BaseEvent {
  eventType: 'booking.created';
  bookingId: string;
  customerId: string;
  welperId: string;
}

export interface BookingStatusChangedEvent extends BaseEvent {
  eventType: 'booking.status_changed';
  bookingId: string;
  previousStatus: string;
  newStatus: string;
}

// --- Payment events ---

export interface PaymentAuthorizedEvent extends BaseEvent {
  eventType: 'payment.authorized';
  bookingId: string;
  amountCents: number;
  currency: string;
}

export interface PaymentCapturedEvent extends BaseEvent {
  eventType: 'payment.captured';
  bookingId: string;
  amountCents: number;
  currency: string;
}

export interface PaymentFailedEvent extends BaseEvent {
  eventType: 'payment.failed';
  bookingId: string;
  reason: string;
}

// --- Review events ---

export interface ReviewSubmittedEvent extends BaseEvent {
  eventType: 'review.submitted';
  reviewId: string;
  bookingId: string;
  reviewerId: string;
  rating: number;
}

// --- Dispute events ---

export interface DisputeOpenedEvent extends BaseEvent {
  eventType: 'dispute.opened';
  disputeId: string;
  bookingId: string;
  openedBy: string;
}

export interface DisputeResolvedEvent extends BaseEvent {
  eventType: 'dispute.resolved';
  disputeId: string;
  resolution: string;
}

// Union of all domain events for type-safe dispatch
export type DomainEvent =
  | UserCreatedEvent
  | BookingCreatedEvent
  | BookingStatusChangedEvent
  | PaymentAuthorizedEvent
  | PaymentCapturedEvent
  | PaymentFailedEvent
  | ReviewSubmittedEvent
  | DisputeOpenedEvent
  | DisputeResolvedEvent;
