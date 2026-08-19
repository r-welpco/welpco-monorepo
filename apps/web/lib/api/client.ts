import type { ApiError } from "@/types";
import { getAuthContext } from "./get-token";

/**
 * Dual-role accounts: header carrying the acting role. The BFF only honors
 * the welper→customer downgrade (a customer can never elevate), so sending
 * the session role on every authenticated request is safe and keeps API
 * authorization in lockstep with what the UI renders.
 */
const ROLE_MODE_HEADER = "X-Welpco-Role";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string,
    /**
     * Day 15 — Phase 3. Raw JSON response body for non-2xx responses (best
     * effort). Carries structured error payloads — e.g.
     * `IncompleteSignupErrorBody.missingFields` from `/auth/signup/finish`,
     * or `{ code: 'EMAIL_VERIFICATION_REQUIRED' }` from `EmailVerifiedGuard`.
     * Undefined when the response wasn't JSON or when parsing failed.
     */
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Day 15 — Phase 3. Subclass surfaced when a bookable-action endpoint returns
 * 403 with `{ code: 'EMAIL_VERIFICATION_REQUIRED' }`. Consumers (typically
 * `useBookableAction`) handle this by surfacing the verification dialog
 * rather than treating it as a generic 403 toast.
 */
export class EmailVerificationRequiredError extends ApiClientError {
  constructor(message: string, body?: unknown) {
    super(message, 403, "EMAIL_VERIFICATION_REQUIRED", body);
    this.name = "EmailVerificationRequiredError";
  }
}

/** BFF rejects resend when the account email is already verified in the database. */
export class EmailAlreadyVerifiedError extends ApiClientError {
  constructor(message = "Email is already verified", body?: unknown) {
    super(message, 400, "EMAIL_ALREADY_VERIFIED", body);
    this.name = "EmailAlreadyVerifiedError";
  }
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  }

  /**
   * Ensures we have a valid access token before making authenticated requests
   * Returns the token (plus the acting role for the X-Welpco-Role header)
   * or throws an error if the token is unavailable.
   * The token is stored in the session by NextAuth after backend authentication.
   */
  private async ensureValidAuthContext(): Promise<{
    token: string;
    actingRole: "customer" | "welper" | null;
  }> {
    const { token, actingRole } = await getAuthContext();
    if (!token) {
      throw new ApiClientError(
        "No access token available. Please login again.",
        401,
        "NO_TOKEN"
      );
    }
    return { token, actingRole };
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {},
    retryCount = 0
  ): Promise<T> {
    const { skipAuth = false, params, ...fetchConfig } = config;
    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null) {
          searchParams.set(key, String(value));
        }
      }
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(typeof fetchConfig.headers === "object" && !Array.isArray(fetchConfig.headers) && fetchConfig.headers !== null
        ? (fetchConfig.headers as Record<string, string>)
        : {}),
    };

    if (!skipAuth) {
      // Ensure we have a valid token before making the request.
      // If no token is available, let the error propagate to the caller
      // instead of hard-redirecting — React Query error boundaries and
      // component-level error handling are more appropriate.
      const { token, actingRole } = await this.ensureValidAuthContext();
      headers.Authorization = `Bearer ${token}`;
      // Dual-role accounts: claim the acting role unless the caller already
      // set the header explicitly (e.g. the mode-switch bootstrap call).
      if (actingRole && !headers[ROLE_MODE_HEADER]) {
        headers[ROLE_MODE_HEADER] = actingRole;
      }
    }

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
        signal: fetchConfig.signal ?? AbortSignal.timeout(30_000),
      });

      // Handle 401 Unauthorized — attempt one silent retry after clearing the
      // cached token so getSession() triggers the JWT callback which refreshes
      // via the refresh token.  Only log out if the retry also fails.
      if (response.status === 401 && !skipAuth) {
        if (retryCount < 1) {
          // Clear stale cached token and retry — the next getSession() will
          // run the JWT callback, see the token is expired, and call
          // /api/auth/refresh with the refresh token.
          const { clearTokenCache } = await import("./get-token");
          clearTokenCache();
          return this.request<T>(endpoint, config, retryCount + 1);
        }
        // Retry already attempted — refresh token is invalid or expired
        console.warn(`Authentication failed for ${endpoint} after retry. Session expired.`);
        throw new ApiClientError("Session expired. Please login again.", 401);
      }
      
      if (!response.ok) {
        // Best-effort JSON body parse. If the response isn't JSON we keep
        // `body: undefined` so consumers can branch on its presence.
        let parsedBody: unknown;
        try {
          parsedBody = await response.json();
        } catch {
          parsedBody = undefined;
        }
        const errorData = (parsedBody && typeof parsedBody === "object"
          ? (parsedBody as ApiError)
          : { message: response.statusText, statusCode: response.status });

        const status = errorData.statusCode || response.status;
        const code = errorData.code;

        if (status === 403 && code === "EMAIL_VERIFICATION_REQUIRED") {
          throw new EmailVerificationRequiredError(
            errorData.message || "Verify your email to continue",
            parsedBody,
          );
        }

        throw new ApiClientError(
          errorData.message || "An error occurred",
          status,
          code,
          parsedBody,
        );
      }

      // Handle empty responses
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }

      return null as unknown as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      throw new ApiClientError(
        error instanceof Error ? error.message : "Network error occurred",
        0
      );
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();

