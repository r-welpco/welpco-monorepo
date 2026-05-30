export enum JobPostingStatus {
  PUBLISHED = 'published',
  APPLICATIONS_OPEN = 'applications_open',
  CONVERTED_TO_BOOKING = 'converted_to_booking',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  CANCELLED = 'cancelled',
}

export enum JobApplicationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export const JOB_POSTING_MAX_APPLICATIONS = 20;
export const JOB_POSTING_EXPIRY_DAYS = 30;

export type JobApplyBlockReason =
  | 'NOT_DISCOVERABLE'
  | 'NO_MATCHING_OFFERING'
  | 'JOB_CLOSED'
  | 'JOB_EXPIRED'
  | 'APPLICATION_CAP_REACHED'
  | 'ALREADY_APPLIED'
  | 'NOT_CUSTOMER_OWNER';
