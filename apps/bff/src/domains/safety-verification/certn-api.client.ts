import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fetchJson } from '../../common/http/fetch-json';

export interface CertnInvitePayload {
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface CertnInviteResult {
  applicationId: string;
  /** Applicant-facing screening URL when Certn returns one (uncommon on invite). */
  applicantUrl: string | null;
  /** True when invite API succeeded but no public URL — applicant completes via email link. */
  inviteDeliveredViaEmail: boolean;
}

/** Production Certn API (HR industry). */
export const CERTN_API_BASE_URL_PRODUCTION = 'https://api.certn.co';

/** Certn demo/sandbox API — use for local and non-production environments. */
export const CERTN_API_BASE_URL_SANDBOX = 'https://demo-api.certn.co';

/** Demo dashboard — create account, API keys, webhooks (employer admin, not welper screening). */
export const CERTN_DEMO_SIGNUP_URL = 'https://demo-app.certn.co/welcome/signUp';

/** Employer admin login — must never be shown as the welper "Open Certn verification" link. */
const EMPLOYER_DASHBOARD_URL_PATTERNS = [
  /\/login\/?(\?.*)?$/i,
  /\/welcome\/signUp\/?$/i,
  /\/settings\/?$/i,
];

export function isEmployerDashboardUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    const isEmployerHost =
      host === 'demo-app.certn.co' ||
      host === 'app.certn.co' ||
      host.endsWith('.certn.co') && host.includes('app');
    if (!isEmployerHost) return false;
    return EMPLOYER_DASHBOARD_URL_PATTERNS.some((p) => p.test(url));
  } catch {
    return false;
  }
}

/** Drop stale stub/admin URLs persisted before invite flow was fixed. */
export function sanitizeCertnApplicantUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const trimmed = url.trim();
  return isEmployerDashboardUrl(trimmed) ? null : trimmed;
}

/**
 * Certn HR invite API. When `CERTN_API_KEY` is unset, returns a deterministic
 * stub so local signup can be exercised without Certn credentials.
 */
@Injectable()
export class CertnApiClient {
  private readonly logger = new Logger(CertnApiClient.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * Identity verification is a separate Certn plan feature. Production "Team Welpco"
   * may only have CRC — set CERTN_REQUEST_IDENTITY_VERIFICATION=false to invite with
   * criminal record check only (or contact support@certn.co to enable IDV).
   */
  shouldRequestIdentityVerification(): boolean {
    const raw = this.config.get<string>('CERTN_REQUEST_IDENTITY_VERIFICATION');
    if (raw === 'false' || raw === '0') return false;
    if (raw === 'true' || raw === '1') return true;
    return true;
  }

  /** Sandbox in development unless `CERTN_API_BASE_URL` is set explicitly. */
  resolveApiBaseUrl(): string {
    const configured = this.config.get<string>('CERTN_API_BASE_URL')?.trim();
    if (configured) {
      return configured.replace(/\/$/, '');
    }
    const nodeEnv = this.config.get<string>('NODE_ENV') ?? 'development';
    return nodeEnv === 'production'
      ? CERTN_API_BASE_URL_PRODUCTION
      : CERTN_API_BASE_URL_SANDBOX;
  }

  async createInvite(payload: CertnInvitePayload): Promise<CertnInviteResult> {
    const apiKey = this.config.get<string>('CERTN_API_KEY')?.trim();
    const baseUrl = this.resolveApiBaseUrl();

    if (!apiKey) {
      throw new Error(
        'CERTN_API_KEY is not configured. Add a demo API key from https://demo-app.certn.co/login → Settings → API Keys',
      );
    }

    // Invite endpoint emails the applicant a screening link (see Certn HR API docs).
    const inviteUrl = `${baseUrl}/hr/v1/applications/invite/`;
    this.logger.log(`Certn invite → ${inviteUrl}`);

    const requestIdentityVerification = this.shouldRequestIdentityVerification();

    const body: Record<string, unknown> = {
      email: payload.email,
      request_criminal_record_check: true,
      information: {
        first_name: payload.firstName,
        last_name: payload.lastName,
        date_of_birth: payload.dateOfBirth,
      },
    };

    if (requestIdentityVerification) {
      body.request_identity_verification = true;
    } else {
      this.logger.log(
        'Certn invite: request_criminal_record_check only (CERTN_REQUEST_IDENTITY_VERIFICATION=false)',
      );
    }

    const res = await fetchJson(inviteUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Certn invite failed (${res.status}): ${text.slice(0, 500)}`);
    }

    const data = (await res.json()) as Record<string, unknown>;
    const applicationId = this.extractApplicationId(data);
    if (!applicationId) {
      throw new Error('Certn invite response missing application id');
    }

    const applicantUrl = sanitizeCertnApplicantUrl(this.extractApplicantUrl(data));
    if (!applicantUrl) {
      this.logger.log(
        `Certn invite created (${applicationId}); no applicant URL in response — applicant should use email link`,
      );
    }

    return {
      applicationId,
      applicantUrl,
      inviteDeliveredViaEmail: !applicantUrl,
    };
  }

  private extractApplicationId(data: Record<string, unknown>): string {
    const direct =
      (data.id as string) ||
      (data.application_id as string) ||
      (data.uuid as string) ||
      '';
    if (direct) return direct;

    const applicant = data.applicant as Record<string, unknown> | undefined;
    if (applicant?.id && typeof applicant.id === 'string') return applicant.id;

    const application = data.application as Record<string, unknown> | undefined;
    return (
      (application?.id as string) ||
      (application?.application_id as string) ||
      ''
    );
  }

  private extractApplicantUrl(data: Record<string, unknown>): string | null {
    const priorityKeys = [
      'applicant_url',
      'invite_url',
      'screening_url',
      'application_url',
      'url',
      'link',
    ];

    for (const key of priorityKeys) {
      const val = data[key];
      if (typeof val === 'string' && val.startsWith('http')) {
        return val;
      }
    }

    const nested = data.applicant as Record<string, unknown> | undefined;
    if (nested) {
      for (const key of priorityKeys) {
        const val = nested[key];
        if (typeof val === 'string' && val.startsWith('http')) {
          return val;
        }
      }
    }

    return this.findHttpUrlInTree(data);
  }

  private findHttpUrlInTree(value: unknown, depth = 0): string | null {
    if (depth > 8 || value == null) return null;
    if (typeof value === 'string' && value.startsWith('http')) {
      return value;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const found = this.findHttpUrlInTree(item, depth + 1);
        if (found) return found;
      }
      return null;
    }
    if (typeof value === 'object') {
      for (const entry of Object.values(value as Record<string, unknown>)) {
        const found = this.findHttpUrlInTree(entry, depth + 1);
        if (found) return found;
      }
    }
    return null;
  }
}
