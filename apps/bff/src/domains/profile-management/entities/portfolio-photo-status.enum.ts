/**
 * SHARE-001: moderation state of a welper portfolio photo.
 *
 * Photos are `pending` on upload and only become publicly visible once an
 * admin flips them to `approved` (bible §22.6 / plan §4: moderation before
 * publish). `rejected` photos stay visible to the owner (with
 * `rejectionReason`) so they can fix and re-upload.
 */
export enum PortfolioPhotoStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}
