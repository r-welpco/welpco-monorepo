export interface HumanVerificationPayload {
  turnstileToken?: string | null;
  website?: string | null;
}

interface TurnstileVerifyResponse {
  success: boolean;
  action?: string;
  hostname?: string;
  'error-codes'?: string[];
}

export async function verifyHumanRequest(
  payload: HumanVerificationPayload,
  options: { action: string; required?: boolean },
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (payload.website?.trim()) {
    return { ok: false, error: 'Unable to process request', status: 400 };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production' && options.required !== false) {
      return { ok: false, error: 'Human verification is not configured', status: 503 };
    }
    return { ok: true };
  }

  const token = payload.turnstileToken?.trim();
  if (!token) {
    if (options.required === false) return { ok: true };
    return { ok: false, error: 'Complete the human verification challenge', status: 400 };
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    });
    const data = (await response.json()) as TurnstileVerifyResponse;

    if (!data.success) {
      return { ok: false, error: 'Human verification failed', status: 400 };
    }
    if (data.action && data.action !== options.action) {
      return { ok: false, error: 'Human verification failed', status: 400 };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Human verification is temporarily unavailable', status: 503 };
  }
}
