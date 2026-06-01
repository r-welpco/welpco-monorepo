"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Callout } from "@welpco/ui/callout";
import { Badge } from "@welpco/ui/badge";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRef, useState } from "react";
import { TextField } from "@welpco/ui/text-field";
import {
  DEFAULT_ACCOUNT_VERIFICATION_LABELS,
  type AccountVerificationLabels,
} from "./signup-steps/labels";

export type { AccountVerificationLabels } from "./signup-steps/labels";

export interface AccountVerificationProps {
  email?: string;
  phoneNumber?: string;
  loading?: boolean;
  error?: string;
  labels?: AccountVerificationLabels;
  onSubmit?: (values: AccountVerificationValues) => void | Promise<void>;
  onResend?: (values: Pick<AccountVerificationValues, "website">) => void | Promise<void>;
}

function formatLabel(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    template,
  );
}

function createSchema(labels: AccountVerificationLabels) {
  return z.object({
    code: z
      .string()
      .regex(/^[0-9]{6}$/, labels.validation.codeInvalid)
      .trim(),
    website: z.string().max(200).optional(),
  });
}

export type AccountVerificationValues = z.infer<ReturnType<typeof createSchema>>;

export function AccountVerification({
  email,
  phoneNumber,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onResend,
}: AccountVerificationProps) {
  const labels = labelsProp ?? DEFAULT_ACCOUNT_VERIFICATION_LABELS;
  const schema = useMemo(() => createSchema(labels), [labels]);

  const form = useForm<AccountVerificationValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "", website: "" },
  });

  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(-1);

    const newOtpValues = [...otpValues];
    newOtpValues[index] = numericValue;
    setOtpValues(newOtpValues);

    const code = newOtpValues.join("");
    form.setValue("code", code, { shouldValidate: true });

    if (numericValue && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtpValues = pastedData.split("").concat(Array(6 - pastedData.length).fill(""));
    setOtpValues(newOtpValues);

    const code = newOtpValues.join("");
    form.setValue("code", code, { shouldValidate: true });

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = form.handleSubmit(async (values: AccountVerificationValues) => {
    await onSubmit?.(values);
  });

  const contactInfo = email || phoneNumber;

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "460px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="6" mb="2" trim="start">
            {labels.title}
          </Heading>
          <Flex align="center" gap="2" wrap="wrap">
            <Text size="2" color="gray" highContrast>
              {labels.codeSentPrefix}
            </Text>
            {contactInfo && (
              <Badge color="gray" variant="soft" size="1" highContrast>
                {contactInfo}
              </Badge>
            )}
          </Flex>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "-10000px",
              top: "auto",
              width: 1,
              height: 1,
              overflow: "hidden",
            }}
          >
            <label htmlFor="verification-website">Leave this field blank</label>
            <input
              id="verification-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register("website")}
            />
          </div>

          <Box mb="3">
            <Text as="label" size="2" weight="bold" mb="1">
              {labels.codeLabel}
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
                {labels.requiredMarker}
              </Text>
            </Text>
            <Box>
              <Flex gap="2" justify="center">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <Box
                    key={index}
                    ref={(el) => {
                      const input = el?.querySelector("input");
                      if (input) {
                        inputRefs.current[index] = input;
                      }
                    }}
                  >
                    <TextField.Root
                      aria-label={formatLabel(labels.codeDigitAria, {
                        index: index + 1,
                        total: otpValues.length,
                      })}
                      autoComplete={index === 0 ? "one-time-code" : "off"}
                      value={otpValues[index]}
                      onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        handleInputChange(index, target.value);
                      }}
                      onKeyDown={(e) => {
                        handleKeyDown(index, e as unknown as React.KeyboardEvent<HTMLInputElement>);
                      }}
                      onPaste={handlePaste}
                      disabled={loading}
                      size="2"
                      style={{ width: "48px" }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      placeholder=""
                    />
                  </Box>
                ))}
                <input
                  type="hidden"
                  {...form.register("code")}
                  value={otpValues.join("")}
                />
              </Flex>
            </Box>
            {form.formState.errors.code && (
              <Text size="1" role="alert" color={SEMANTIC_COLOR.danger} mt="2" align="center">
                {form.formState.errors.code.message}
              </Text>
            )}
          </Box>

          <Flex
            gap="2"
            mt="3"
            direction={{ initial: "column", sm: "row" }}
          >
            <Button
              type="button"
              variant="ghost"
              color="gray"
              size="3"
              disabled={loading}
              onClick={() => void onResend?.({ website: form.getValues("website") })}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              {labels.resendCode}
            </Button>
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              {loading ? labels.verifying : labels.verify}
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
