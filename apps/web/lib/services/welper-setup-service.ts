import { apiClient } from "@/lib/api/client";
import type { WelperSetupTaskDto } from "@welpco/types";

export interface WelperSetupChecklistDto {
  setupTasks: WelperSetupTaskDto[];
  setupComplete: boolean;
  allSetupComplete?: boolean;
  discoverable: boolean;
  isMinorWelper?: boolean;
}

export async function getWelperSetupChecklist(): Promise<WelperSetupChecklistDto> {
  return apiClient.get<WelperSetupChecklistDto>("/api/profiles/me/setup-checklist");
}
