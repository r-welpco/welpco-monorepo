import twilio from "twilio";

export interface TwilioSmsConfig {
  accountSid?: string;
  authToken?: string;
  fromNumber?: string;
  /** Force stub even when Twilio creds exist. */
  provider?: "twilio" | "stub";
}

export interface SendSmsOptions {
  to: string;
  body: string;
  from?: string;
}

export interface SendSmsResult {
  sid: string;
  status: string;
  provider: "twilio" | "stub";
}

function trimOrUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function resolveTwilioConfig(
  config?: TwilioSmsConfig,
): Required<
  Pick<TwilioSmsConfig, "accountSid" | "authToken" | "fromNumber">
> & { provider: "twilio" | "stub" } {
  const accountSid =
    trimOrUndefined(config?.accountSid) ??
    trimOrUndefined(process.env.TWILIO_ACCOUNT_SID);
  const authToken =
    trimOrUndefined(config?.authToken) ??
    trimOrUndefined(process.env.TWILIO_AUTH_TOKEN);
  const fromNumber =
    trimOrUndefined(config?.fromNumber) ??
    trimOrUndefined(process.env.TWILIO_FROM_NUMBER);
  const providerEnv =
    trimOrUndefined(config?.provider) ??
    trimOrUndefined(process.env.SMS_PROVIDER);

  const hasCreds = Boolean(accountSid && authToken && fromNumber);
  let provider: "twilio" | "stub" = "stub";
  if (providerEnv === "stub") {
    provider = "stub";
  } else if (providerEnv === "twilio" || (!providerEnv && hasCreds)) {
    provider = hasCreds ? "twilio" : "stub";
  }

  return {
    accountSid: accountSid ?? "",
    authToken: authToken ?? "",
    fromNumber: fromNumber ?? "",
    provider,
  };
}

export function hasTwilioCredentials(config?: TwilioSmsConfig): boolean {
  const resolved = resolveTwilioConfig(config);
  return (
    resolved.provider === "twilio" &&
    Boolean(resolved.accountSid && resolved.authToken && resolved.fromNumber)
  );
}

export async function sendSmsViaTwilio(
  options: SendSmsOptions,
  config?: TwilioSmsConfig,
): Promise<SendSmsResult> {
  const resolved = resolveTwilioConfig(config);
  if (
    !resolved.accountSid ||
    !resolved.authToken ||
    !(options.from ?? resolved.fromNumber)
  ) {
    throw new Error(
      "TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_NUMBER are required for Twilio SMS",
    );
  }

  const client = twilio(resolved.accountSid, resolved.authToken);
  const message = await client.messages.create({
    to: options.to,
    from: options.from ?? resolved.fromNumber,
    body: options.body,
  });

  return {
    sid: message.sid,
    status: message.status ?? "queued",
    provider: "twilio",
  };
}

export async function sendSmsViaStub(
  options: SendSmsOptions,
): Promise<SendSmsResult> {
  const sid = `stub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  // eslint-disable-next-line no-console -- intentional local-dev observability
  console.info(
    `[sms:stub] to=${options.to} sid=${sid} body=${JSON.stringify(options.body)}`,
  );
  return { sid, status: "stubbed", provider: "stub" };
}

/**
 * Send an SMS. Uses Twilio when credentials + provider allow it; otherwise stub.
 */
export async function sendSms(
  options: SendSmsOptions,
  config?: TwilioSmsConfig,
): Promise<SendSmsResult> {
  const to = options.to?.trim();
  const body = options.body?.trim();
  if (!to) throw new Error("SMS `to` is required");
  if (!body) throw new Error("SMS `body` is required");

  if (hasTwilioCredentials(config)) {
    return sendSmsViaTwilio({ ...options, to, body }, config);
  }
  return sendSmsViaStub({ ...options, to, body });
}
