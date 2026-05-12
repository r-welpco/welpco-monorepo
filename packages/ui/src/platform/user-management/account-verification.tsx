"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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

export interface AccountVerificationProps {
  email?: string;
  phoneNumber?: string;
  loading?: boolean;
  error?: string;
  onSubmit?: (values: AccountVerificationValues) => void | Promise<void>;
  onResend?: () => void | Promise<void>;
}

const schema = z.object({
  code: z
    .string()
    .regex(/^[0-9]{6}$/, "Enter the 6-digit code")
    .trim(),
});

export type AccountVerificationValues = z.infer<typeof schema>;

export function AccountVerification({
  email,
  phoneNumber,
  loading,
  error,
  onSubmit,
  onResend,
}: AccountVerificationProps) {
  const form = useForm<AccountVerificationValues>({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });

  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numeric input, take only the last character if multiple entered
    const numericValue = value.replace(/\D/g, "").slice(-1);
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = numericValue;
    setOtpValues(newOtpValues);

    // Update form value
    const code = newOtpValues.join("");
    form.setValue("code", code, { shouldValidate: true });

    // Move focus to next input if value entered
    if (numericValue && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 0);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    // Handle arrow keys
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

    // Focus the next empty input or the last one
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
            Verify your account
          </Heading>
          <Flex align="center" gap="2" wrap="wrap">
            <Text size="2" color="gray" highContrast>
              We sent a 6-digit code to
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
          <Box mb="3">
            <Text as="label" size="2" weight="bold" mb="1">
              Verification code
              <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">*</Text>
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
                      aria-label={`Verification code digit ${index + 1} of ${otpValues.length}`}
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
              onClick={onResend}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              Resend code
            </Button>
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%", flex: 1, minWidth: 0 }}
            >
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

