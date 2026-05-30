import { BadRequestException } from '@nestjs/common';
import { JobPostingStatus } from './entities';

const VALID_TRANSITIONS: Record<JobPostingStatus, JobPostingStatus[]> = {
  [JobPostingStatus.PUBLISHED]: [
    JobPostingStatus.APPLICATIONS_OPEN,
    JobPostingStatus.CANCELLED,
    JobPostingStatus.EXPIRED,
  ],
  [JobPostingStatus.APPLICATIONS_OPEN]: [
    JobPostingStatus.CONVERTED_TO_BOOKING,
    JobPostingStatus.CANCELLED,
    JobPostingStatus.EXPIRED,
  ],
  [JobPostingStatus.CONVERTED_TO_BOOKING]: [JobPostingStatus.COMPLETED],
  [JobPostingStatus.COMPLETED]: [],
  [JobPostingStatus.EXPIRED]: [],
  [JobPostingStatus.CANCELLED]: [],
};

export function validateJobPostingTransition(
  from: JobPostingStatus,
  to: JobPostingStatus,
): void {
  if (from === to) return;
  const allowed = VALID_TRANSITIONS[from] ?? [];
  if (!allowed.includes(to)) {
    throw new BadRequestException(`Cannot transition job from ${from} to ${to}`);
  }
}

export function isJobOpenForApplications(status: JobPostingStatus): boolean {
  return (
    status === JobPostingStatus.PUBLISHED || status === JobPostingStatus.APPLICATIONS_OPEN
  );
}
