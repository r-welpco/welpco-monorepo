import type { JobPostingStatus } from "@/lib/services/job-posting.service";

export function isJobOpenForWelperApplications(status: JobPostingStatus): boolean {
  return status === "published" || status === "applications_open";
}
