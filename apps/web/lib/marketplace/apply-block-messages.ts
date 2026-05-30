import type { JobApplyBlockReason, JobPostingStatus } from "@/lib/services/job-posting.service";

export const APPLY_BLOCK_MESSAGES: Record<JobApplyBlockReason, string> = {
  NOT_DISCOVERABLE:
    "Complete your profile setup and background check to appear in search before applying.",
  NO_MATCHING_OFFERING:
    "Add an active service offering that includes this job's subcategory before you can apply.",
  JOB_CLOSED: "This job is no longer accepting applications.",
  JOB_EXPIRED: "This job has expired.",
  APPLICATION_CAP_REACHED: "This job has reached the maximum number of applications.",
  ALREADY_APPLIED: "You have already applied to this job.",
};

export function isJobOpenForWelperApplications(status: JobPostingStatus): boolean {
  return status === "published" || status === "applications_open";
}
