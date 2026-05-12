/** Admin moderation reason codes (persisted + audit). */
export enum StatusChangeReasonCode {
  TOS_VIOLATION = 'tos_violation',
  FRAUD = 'fraud',
  PAYMENT_ABUSE = 'payment_abuse',
  IMPERSONATION = 'impersonation',
  USER_REQUESTED = 'user_requested',
  OTHER = 'other',
}
