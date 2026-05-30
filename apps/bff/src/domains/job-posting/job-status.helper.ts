import { Repository } from 'typeorm';
import { BookingRequest, BookingRequestStatus } from '../booking/entities/booking-request.entity';
import { JobPosting, JobPostingStatus } from './entities';
import { validateJobPostingTransition } from './job-posting-state-machine';

const TERMINAL_BOOKING_STATUSES = new Set<BookingRequestStatus>([
  BookingRequestStatus.COMPLETED,
  BookingRequestStatus.PAYMENT_RELEASED,
  BookingRequestStatus.CANCELLED,
  BookingRequestStatus.DECLINED,
  BookingRequestStatus.NO_SHOW,
]);

/**
 * On-the-fly job lifecycle refresh — no background cron in MVP.
 * Deferred: daily expiry sweep + warning emails can call the same helpers later.
 */
export async function maybeRefreshJobStatus(
  job: JobPosting,
  jobRepo: Repository<JobPosting>,
  bookingRepo?: Repository<BookingRequest>,
): Promise<JobPosting> {
  const now = new Date();
  let nextStatus = job.status;

  if (
    (job.status === JobPostingStatus.PUBLISHED ||
      job.status === JobPostingStatus.APPLICATIONS_OPEN) &&
    job.expiresAt < now
  ) {
    nextStatus = JobPostingStatus.EXPIRED;
  }

  if (
    job.status === JobPostingStatus.CONVERTED_TO_BOOKING &&
    job.bookingId &&
    bookingRepo
  ) {
    const booking = await bookingRepo.findOne({ where: { id: job.bookingId } });
    if (booking && TERMINAL_BOOKING_STATUSES.has(booking.status)) {
      nextStatus = JobPostingStatus.COMPLETED;
    }
  }

  if (nextStatus !== job.status) {
    validateJobPostingTransition(job.status, nextStatus);
    job.status = nextStatus;
    return jobRepo.save(job);
  }

  return job;
}
