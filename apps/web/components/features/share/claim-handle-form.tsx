"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@welpco/ui/alert-dialog";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Spinner } from "@welpco/ui/spinner";
import { Text } from "@welpco/ui/text";
import { TextField } from "@welpco/ui/text-field";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useAppOrigin } from "@/lib/hooks/use-app-origin";
import { useClaimHandle } from "@/lib/hooks/use-share-hub";
import { ClaimHandleError } from "@/lib/services/share-service";

/**
 * SHARE-004 — set-once vanity-handle claim (§16.1 field rules).
 *
 * The permanence warning sits in the helper text BEFORE any action, and an
 * AlertDialog confirms the exact handle a second time — the BFF has no
 * rename path (409 HANDLE_ALREADY_SET), so a mistaken claim is forever.
 *
 * Validation: on blur + on submit (§16.2), mirroring the BFF regex
 * `^[a-z0-9][a-z0-9-]{2,29}$`; 409 HANDLE_TAKEN / HANDLE_RESERVED map to
 * specific inline errors.
 */

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{2,29}$/;

export function ClaimHandleForm() {
  const t = useTranslations("dashboard.share.handle");
  // Real host, not a hardcoded domain — previews/local dev show their own.
  const { host } = useAppOrigin();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const claimMutation = useClaimHandle();

  const validate = useCallback(
    (raw: string): string | null => {
      const handle = raw.trim().toLowerCase();
      if (!handle) return t("errors.required");
      if (handle.length < 3 || handle.length > 30) return t("errors.length");
      if (!HANDLE_PATTERN.test(handle)) return t("errors.format");
      return null;
    },
    [t],
  );

  const normalized = value.trim().toLowerCase();

  const handleBlur = useCallback(() => {
    if (!value.trim()) {
      setError(null);
      return;
    }
    setError(validate(value));
  }, [value, validate]);

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const validationError = validate(value);
      setError(validationError);
      if (!validationError) setConfirmOpen(true);
    },
    [value, validate],
  );

  const handleConfirmClaim = useCallback(() => {
    setConfirmOpen(false);
    claimMutation.mutate(normalized, {
      onError: (err) => {
        if (err instanceof ClaimHandleError) {
          switch (err.claimCode) {
            case "HANDLE_TAKEN":
              setError(t("errors.taken", { handle: normalized }));
              return;
            case "HANDLE_RESERVED":
              setError(t("errors.reserved", { handle: normalized }));
              return;
            case "HANDLE_ALREADY_SET":
              // Stale cache — the invalidation from the hook refreshes the hub.
              setError(t("errors.alreadySet"));
              return;
            case "INVALID_HANDLE":
              setError(t("errors.format"));
              return;
          }
        }
        setError(t("errors.generic"));
      },
    });
  }, [claimMutation, normalized, t]);

  const pending = claimMutation.isPending;
  const inputId = "share-handle-input";
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = `${inputId}-helper`;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Box>
        <Text
          as="label"
          size="2"
          weight="medium"
          mb={FORM_SPACING.labelGap}
          htmlFor={inputId}
          style={{ display: "block" }}
        >
          {t("label")}
        </Text>
        <Flex gap="2" align="start" wrap="wrap">
          <Box style={{ flexGrow: 1, minWidth: "220px", maxWidth: "360px" }}>
            <TextField.Root
              id={inputId}
              size="2"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              onBlur={handleBlur}
              placeholder={t("placeholder")}
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={30}
              disabled={pending}
              aria-invalid={error ? true : undefined}
              aria-describedby={errorId ?? helperId}
            >
              <TextField.Slot>
                <Text size="2" color="gray">
                  {`${host}/w/`}
                </Text>
              </TextField.Slot>
            </TextField.Root>
          </Box>
          <Button
            type="submit"
            size="2"
            color={SEMANTIC_COLOR.primary}
            disabled={pending}
          >
            {pending ? <Spinner /> : t("submit")}
          </Button>
        </Flex>
        {error ? (
          <Text
            id={errorId}
            role="alert"
            as="p"
            size="1"
            color={SEMANTIC_COLOR.danger}
            mt={FORM_SPACING.helperGap}
          >
            {error}
          </Text>
        ) : (
          <Text id={helperId} as="p" size="1" color="gray" mt={FORM_SPACING.helperGap}>
            {t("helper")}
          </Text>
        )}
      </Box>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent maxWidth="420px">
          <AlertDialogTitle>
            {t("confirm.title", { handle: normalized })}
          </AlertDialogTitle>
          <AlertDialogDescription size="2">
            {t("confirm.description", { handle: normalized, host })}
          </AlertDialogDescription>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialogCancel>
              <Button variant="soft" color={SEMANTIC_COLOR.neutral}>
                {t("confirm.cancel")}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction>
              <Button color={SEMANTIC_COLOR.primary} onClick={handleConfirmClaim}>
                {t("confirm.claim")}
              </Button>
            </AlertDialogAction>
          </Flex>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
