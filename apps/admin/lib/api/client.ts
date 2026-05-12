import { getAccessToken } from "./get-token";

export class ApiClientError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiClientError";
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

  private async ensureValidToken(): Promise<string> {
    const token = await getAccessToken();
    if (!token) {
      throw new ApiClientError("No access token available. Please login again.", 401, "NO_TOKEN");
    }
    return token;
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}, retryCount = 0): Promise<T> {
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
      ...(typeof fetchConfig.headers === "object" &&
      !Array.isArray(fetchConfig.headers) &&
      fetchConfig.headers !== null
        ? (fetchConfig.headers as Record<string, string>)
        : {}),
    };

    if (!skipAuth) {
      const token = await this.ensureValidToken();
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        headers,
      });

      if (response.status === 401 && !skipAuth) {
        if (retryCount < 1) {
          const { clearTokenCache } = await import("./get-token");
          clearTokenCache();
          return this.request<T>(endpoint, config, retryCount + 1);
        }
        throw new ApiClientError("Session expired. Please login again.", 401);
      }

      if (!response.ok) {
        const errorData = (await response.json().catch(() => ({
          message: response.statusText,
          statusCode: response.status,
        }))) as { message?: string; statusCode?: number; code?: string };

        throw new ApiClientError(
          errorData.message || "An error occurred",
          errorData.statusCode || response.status,
          errorData.code
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      return null as unknown as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError(error instanceof Error ? error.message : "Network error occurred", 0);
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
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
