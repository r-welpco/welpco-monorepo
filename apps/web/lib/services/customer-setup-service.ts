import { apiClient } from "@/lib/api/client";
import type { CustomerSetupTaskDto } from "@welpco/types";

export interface CustomerSetupChecklistDto {
  setupTasks: CustomerSetupTaskDto[];
  setupComplete: boolean;
  allSetupComplete?: boolean;
}

export async function getCustomerSetupChecklist(): Promise<CustomerSetupChecklistDto> {
  return apiClient.get<CustomerSetupChecklistDto>("/api/profiles/me/setup-checklist");
}
