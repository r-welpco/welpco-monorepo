export interface BaseEvent {
    eventId: string;
    eventType: string;
    timestamp: string;
    source: string;
}
export interface UserCreatedEvent extends BaseEvent {
    eventType: 'user.created';
    userId: string;
    userRole: string;
}
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
export interface ReviewSubmittedEvent extends BaseEvent {
    eventType: 'review.submitted';
    reviewId: string;
    bookingId: string;
    reviewerId: string;
    rating: number;
}
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
export type DomainEvent = UserCreatedEvent | BookingCreatedEvent | BookingStatusChangedEvent | PaymentAuthorizedEvent | PaymentCapturedEvent | PaymentFailedEvent | ReviewSubmittedEvent | DisputeOpenedEvent | DisputeResolvedEvent;
//# sourceMappingURL=index.d.ts.map