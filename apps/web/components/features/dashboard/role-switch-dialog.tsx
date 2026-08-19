"use client";

import { useTranslations } from "next-intl";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface RoleSwitchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The role the user would switch INTO. */
  targetRole: "customer" | "welper";
  /** Performs the actual switch; the dialog shows a busy state while pending. */
  onConfirm: () => Promise<void>;
  isSwitching: boolean;
}

/**
 * Dual-role accounts: confirmation step before flipping the acting role.
 * The switch itself (profile bootstrap + session update + redirect) lives in
 * the dashboard layout's handler — this dialog only gates it.
 */
export function RoleSwitchDialog({
  open,
  onOpenChange,
  targetRole,
  onConfirm,
  isSwitching,
}: RoleSwitchDialogProps) {
  const t = useTranslations("dashboard.nav.roleSwitch");
  const toCustomer = targetRole === "customer";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (isSwitching) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        title={toCustomer ? t("confirmToCustomerTitle") : t("confirmToWelperTitle")}
        description={toCustomer ? t("confirmToCustomerBody") : t("confirmToWelperBody")}
      >
        <Flex justify="end" gap="3" mt="2">
          <Button
            variant="soft"
            color="gray"
            disabled={isSwitching}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button
            color={SEMANTIC_COLOR.primary}
            disabled={isSwitching}
            onClick={() => void onConfirm()}
          >
            {isSwitching ? t("switching") : t("confirm")}
          </Button>
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
