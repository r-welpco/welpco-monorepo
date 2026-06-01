import { Resend } from "resend";
import type { SendMailOptions } from "./transport";

export interface ResendConfig {
  apiKey?: string;
  from?: string;
}

function resolveFrom(options: SendMailOptions, config?: ResendConfig): string {
  return (
    options.from ??
    config?.from ??
    process.env.SMTP_FROM ??
    "noreply@welpco.com"
  );
}

function resolveApiKey(
  config?: (ResendConfig & { resendApiKey?: string }) | undefined,
): string | undefined {
  const raw = config?.apiKey ?? config?.resendApiKey ?? process.env.RESEND_API_KEY;
  const trimmed = raw?.trim();
  return trimmed || undefined;
}

/** Send via the official Resend SDK. */
export async function sendMailViaResend(
  options: SendMailOptions,
  config?: ResendConfig,
): Promise<{ id: string }> {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required for Resend delivery");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: resolveFrom(options, config),
    to: [options.to],
    subject: options.subject,
    html: options.html,
    text: options.text ?? options.html.replace(/<[^>]*>/g, ""),
  });

  if (error) {
    throw new Error(
      typeof error.message === "string"
        ? error.message
        : `Resend API error: ${JSON.stringify(error)}`,
    );
  }

  if (!data?.id) {
    throw new Error("Resend API did not return an email id");
  }

  return { id: data.id };
}

export function hasResendApiKey(
  config?: (ResendConfig & { resendApiKey?: string }) | undefined,
): boolean {
  return Boolean(resolveApiKey(config));
}
