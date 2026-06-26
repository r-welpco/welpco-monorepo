"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Text } from "@welpco/ui/text";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { useDashboardCommonLabels } from "@/lib/i18n/use-dashboard-labels";
import { useResendVerification } from "@/lib/hooks/use-resend-verification";

type NoteKind = "success" | "error" | "info";

type EmailVerificationResendContextValue = {
  submit: () => void;
  note: string | null;
  noteKind: NoteKind;
  isPending: boolean;
  turnstileEnabled: boolean;
  turnstileToken: string | null;
  setTurnstileToken: (token: string | null) => void;
  turnstileResetKey: number;
};

const EmailVerificationResendContext =
  createContext<EmailVerificationResendContextValue | null>(null);

function useEmailVerificationResendContext() {
  const value = useContext(EmailVerificationResendContext);
  if (!value) {
    throw new Error("EmailVerificationResend components must be used within EmailVerificationResendProvider");
  }
  return value;
}

export function EmailVerificationResendProvider({ children }: { children: ReactNode }) {
  const t = useTranslations("dashboard.setup");
  const common = useDashboardCommonLabels();
  const resend = useResendVerification();
  const [note, setNote] = useState<string | null>(null);
  const [noteKind, setNoteKind] = useState<NoteKind>("info");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  const submit = () => {
    setNote(null);
    if (turnstileEnabled && !turnstileToken) {
      setNoteKind("error");
      setNote(common.turnstileComplete);
      return;
    }

    void resend.mutateAsync({ turnstileToken: turnstileToken ?? undefined }).then(
      (result) => {
        setNoteKind("success");
        setNote(
          result.outcome === "sent" ? t("resendSent") : t("alreadyVerified"),
        );
      },
      (err: unknown) => {
        setTurnstileResetKey((key) => key + 1);
        setTurnstileToken(null);
        setNoteKind("error");
        setNote(err instanceof Error ? err.message : t("resendFailed"));
      },
    );
  };

  return (
    <EmailVerificationResendContext.Provider
      value={{
        submit,
        note,
        noteKind,
        isPending: resend.isPending,
        turnstileEnabled,
        turnstileToken,
        setTurnstileToken,
        turnstileResetKey,
      }}
    >
      {children}
    </EmailVerificationResendContext.Provider>
  );
}

export function EmailVerificationResendButton() {
  const t = useTranslations("dashboard.setup");
  const { submit, isPending, turnstileEnabled, turnstileToken } =
    useEmailVerificationResendContext();
  const needsTurnstile = turnstileEnabled && !turnstileToken;

  return (
    <Button
      size="1"
      variant="soft"
      color={SEMANTIC_COLOR.primary}
      disabled={isPending || needsTurnstile}
      onClick={submit}
      title={needsTurnstile ? t("turnstileRequiredHint") : undefined}
    >
      {isPending ? t("resendSending") : t("resendVerification")}
    </Button>
  );
}

export function EmailVerificationResendExtras() {
  const t = useTranslations("dashboard.setup");
  const { note, noteKind, turnstileEnabled, setTurnstileToken, turnstileResetKey } =
    useEmailVerificationResendContext();

  return (
    <>
      {turnstileEnabled ? (
        <Box style={{ width: "100%", minHeight: 65 }}>
          <Text size="1" color="gray" as="p" mb="2">
            {t("turnstileRequiredHint")}
          </Text>
          <TurnstileWidget
            action="resend_verification"
            resetKey={turnstileResetKey}
            onToken={setTurnstileToken}
          />
        </Box>
      ) : null}
      {note ? (
        <Text
          size="1"
          color={
            noteKind === "error"
              ? SEMANTIC_COLOR.danger
              : noteKind === "success"
                ? "green"
                : "gray"
          }
          as="p"
        >
          {note}
        </Text>
      ) : null}
    </>
  );
}
