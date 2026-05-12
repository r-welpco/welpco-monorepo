import { getAccessToken } from "@/lib/api/get-token";

function apiBase(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
}

/** Download captured payment rows for Desjardins / reconciliation (admin JWT). */
export async function fetchAdminPaymentsExport(params: {
  welperId?: string;
  dateFrom?: string;
  dateTo?: string;
  format?: "csv" | "json";
}): Promise<{ body: string; contentType: string; filename: string }> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Not authenticated");
  }
  const u = new URL(`${apiBase()}/api/admin/payments/export`);
  if (params.welperId) u.searchParams.set("welperId", params.welperId);
  if (params.dateFrom) u.searchParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) u.searchParams.set("dateTo", params.dateTo);
  u.searchParams.set("format", params.format ?? "csv");

  const res = await fetch(u.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(text || `Export failed (${res.status})`);
  }
  const contentType = res.headers.get("content-type") || "text/plain";
  const body = await res.text();
  const filename =
    params.format === "json" ? "welpco-payments.json" : "welpco-payments.csv";
  return { body, contentType, filename };
}
