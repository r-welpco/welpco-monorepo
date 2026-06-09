export enum WelperPayoutLedgerStatus {
  PENDING = 'pending',
  SCHEDULED = 'scheduled',
  TRANSFERRED = 'transferred',
  EXCLUDED = 'excluded',
  FAILED = 'failed',
}

export enum PayoutBatchStatus {
  REVIEW = 'review',
  APPROVED = 'approved',
  EXECUTING = 'executing',
  COMPLETED = 'completed',
  PARTIAL = 'partial',
  FAILED = 'failed',
}
