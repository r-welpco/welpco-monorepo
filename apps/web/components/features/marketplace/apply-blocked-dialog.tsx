"use client";

import { useRouter } from "next/navigation";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import type { JobApplyBlockReason } from "@/lib/services/job-posting.service";
import { APPLY_BLOCK_MESSAGES } from "@/lib/marketplace/apply-block-messages";

interface ApplyBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: JobApplyBlockReason | null | undefined;
}

export function ApplyBlockedDialog({ open, onOpenChange, reason }: ApplyBlockedDialogProps) {
  const router = useRouter();
  const message = reason ? APPLY_BLOCK_MESSAGES[reason] : null;

  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Cannot apply yet">
        <Text size="2">{message}</Text>
        <Flex justify="end" gap="3" mt="4">
          <Button variant="soft" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {reason === "NO_MATCHING_OFFERING" && (
            <Button
              color={SEMANTIC_COLOR.primary}
              onClick={() => {
                onOpenChange(false);
                router.push("/dashboard/profile?tab=offerings");
              }}
            >
              Manage offerings
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
              Complete profile
            </Button>
          )}
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
