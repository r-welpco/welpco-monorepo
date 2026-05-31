"use client";

import { useRouter } from "next/navigation";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { JobApplyBlockReason } from "@/lib/services/job-posting.service";
import { useMarketplaceLabels } from "@/lib/i18n/use-dashboard-labels";

interface ApplyBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: JobApplyBlockReason | null | undefined;
}

export function ApplyBlockedDialog({ open, onOpenChange, reason }: ApplyBlockedDialogProps) {
  const router = useRouter();
  const labels = useMarketplaceLabels();

  if (!reason) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={labels.applyBlocked.title}>
        <Text size="2">{labels.applyBlocked.message(reason)}</Text>
        <Flex justify="end" gap="3" mt="4">
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            {labels.applyBlocked.close}
          </Button>
          {reason === "NO_MATCHING_OFFERING" && (
            <Button
              color={SEMANTIC_COLOR.primary}
              onClick={() => {
                onOpenChange(false);
                router.push("/dashboard/profile?tab=offerings");
              }}
            >
              {labels.applyBlocked.manageOfferings}
            </Button>
          )}
          {reason === "NOT_DISCOVERABLE" && (
            <Button
              color={SEMANTIC_COLOR.primary}
              onClick={() => {
                onOpenChange(false);
                router.push("/dashboard/profile");
              }}
            >
              {labels.applyBlocked.completeProfile}
            </Button>
          )}
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
