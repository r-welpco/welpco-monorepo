import type { SendMailOptions } from "./transport";

const RESEND_API_URL = "https://api.resend.com/emails";

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

function resolveApiKey(config?: ResendConfig): string | undefined {
  return config?.apiKey ?? process.env.RESEND_API_KEY ?? undefined;
}

/** Send via Resend HTTP API (required on Vercel — outbound SMTP is blocked). */
export async function sendMailViaResend(
  options: SendMailOptions,
  config?: ResendConfig,
): Promise<{ id: string }> {
  const apiKey = resolveApiKey(config);
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required for Resend HTTP delivery");
  }

  const from = resolveFrom(options, config);
  const text = options.text ?? options.html.replace(/<[^>]*>/g, "");

  let response: Response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text,
      }),
    });
  } catch (error) {
    throw formatFetchError(error);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }

  return JSON.parse(body) as { id: string };
}

function formatFetchError(error: unknown): Error {
  if (!(error instanceof Error)) {
    return new Error(String(error));
  }
  const cause = error.cause as NodeJS.ErrnoException | undefined;
  if (cause?.code || cause?.message) {
    return new Error(
      `Resend HTTP request failed (${cause.code ?? "network"}): ${cause.message ?? error.message}`,
      { cause: error },
    );
  }
  return error;
}

export function hasResendApiKey(config?: ResendConfig): boolean {
  return Boolean(resolveApiKey(config));
}
