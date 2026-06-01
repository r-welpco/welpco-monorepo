import type { SendMailOptions } from "./transport";

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_RESEND_TIMEOUT_MS = 8_000;
const DEFAULT_RESEND_MAX_ATTEMPTS = 3;
const RETRYABLE_NETWORK_CODES = new Set([
  "ETIMEDOUT",
  "ECONNRESET",
  "ECONNREFUSED",
  "EPIPE",
  "ENOTFOUND",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "UND_ERR_HEADERS_TIMEOUT",
  "UND_ERR_BODY_TIMEOUT",
]);

export interface ResendConfig {
  apiKey?: string;
  from?: string;
  /** Per-request timeout in ms (default 8000). */
  requestTimeoutMs?: number;
  /** Max attempts including the first try (default 3). */
  maxAttempts?: number;
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

function readPositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveRequestTimeoutMs(config?: ResendConfig): number {
  return config?.requestTimeoutMs ?? readPositiveInt(process.env.RESEND_REQUEST_TIMEOUT_MS, DEFAULT_RESEND_TIMEOUT_MS);
}

function resolveMaxAttempts(config?: ResendConfig): number {
  return config?.maxAttempts ?? readPositiveInt(process.env.RESEND_MAX_ATTEMPTS, DEFAULT_RESEND_MAX_ATTEMPTS);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableResendNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;

  const codes = new Set<string>();
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current instanceof Error; depth += 1) {
    const errno = current as NodeJS.ErrnoException;
    if (errno.code) codes.add(errno.code);
    current = errno.cause;
  }

  for (const code of codes) {
    if (RETRYABLE_NETWORK_CODES.has(code)) return true;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("timed out") ||
    message.includes("network socket disconnected") ||
    message.includes("secure tls connection") ||
    message.includes("resend http request failed")
  );
}

async function sendMailViaResendOnce(
  options: SendMailOptions,
  config: ResendConfig & { apiKey: string },
): Promise<{ id: string }> {
  const from = resolveFrom(options, config);
  const text = options.text ?? options.html.replace(/<[^>]*>/g, "");
  const timeoutMs = resolveRequestTimeoutMs(config);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(RESEND_API_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        // Mitigate undici keep-alive race conditions on Vercel serverless.
        Connection: "close",
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
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Resend HTTP request timed out after ${timeoutMs}ms`);
    }
    throw formatFetchError(error);
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Resend API error ${response.status}: ${body}`);
  }

  return JSON.parse(body) as { id: string };
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

  const maxAttempts = resolveMaxAttempts(config);
  const resolvedConfig = { ...config, apiKey };
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await sendMailViaResendOnce(options, resolvedConfig);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const canRetry = attempt < maxAttempts && isRetryableResendNetworkError(lastError);
      if (!canRetry) {
        throw lastError;
      }
      await sleep(250 * 2 ** (attempt - 1));
    }
  }

  throw lastError ?? new Error("Resend HTTP request failed");
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

export function hasResendApiKey(
  config?: (ResendConfig & { resendApiKey?: string }) | undefined,
): boolean {
  return Boolean(resolveApiKey(config));
}
