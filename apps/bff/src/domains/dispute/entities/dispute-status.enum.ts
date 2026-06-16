/**
 * Wave 2 (BFF): `withdrawn` added — the filer can withdraw their own dispute
 * before admin resolves. Soft-status change only, never hard-deleted.
 *
 * Note: the DB column is `varchar(32)`, NOT a Postgres enum, so no migration
 * is required to extend the value set. Existing rows stay on their current
 * status.
 */
export type DisputeStatus =
  | 'open'
  | 'in_review'
  | 'resolved'
  | 'closed'
  | 'escalated'
  | 'awaiting_refund'
  | 'awaiting_recovery'
  | 'withdrawn';
