import { ServiceOffering } from '../profile-management/entities/service-offering.entity';
import {
  JobApplyBlockReason,
  JobPosting,
  JobPostingStatus,
} from './entities';
import { isJobOpenForApplications } from './job-posting-state-machine';

export function offeringMatchesSubcategory(
  offering: ServiceOffering,
  subcategoryId: string,
): boolean {
  if (!offering.active) return false;
  const ids = Array.isArray(offering.subcategoryIds) ? offering.subcategoryIds : [];
  return ids.includes(subcategoryId);
}

export function resolveMatchingOfferings(
  offerings: ServiceOffering[],
  subcategoryId: string,
): ServiceOffering[] {
  return offerings.filter((o) => offeringMatchesSubcategory(o, subcategoryId));
}

export function resolveApplyBlockReason(params: {
  job: JobPosting;
  discoverable: boolean;
  matchingOfferings: ServiceOffering[];
  existingApplication: boolean;
}): JobApplyBlockReason | null {
  const { job, discoverable, matchingOfferings, existingApplication } = params;

  if (existingApplication) return 'ALREADY_APPLIED';
  if (job.status === JobPostingStatus.EXPIRED) return 'JOB_EXPIRED';
  if (!isJobOpenForApplications(job.status)) return 'JOB_CLOSED';
  if (job.applicationCount >= job.maxApplications) return 'APPLICATION_CAP_REACHED';
  if (!discoverable) return 'NOT_DISCOVERABLE';
  if (matchingOfferings.length === 0) return 'NO_MATCHING_OFFERING';
  return null;
}
