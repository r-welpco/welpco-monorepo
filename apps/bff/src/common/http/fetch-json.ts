/**
 * Typed wrapper around global `fetch`.
 * Some CI hosts (e.g. Vercel) resolve bare `fetch()` to Express `Response`, which has no `ok`/`json`.
 */
export type JsonFetchResponse = {
  ok: boolean;
  status: number;
  json<T = unknown>(): Promise<T>;
  text(): Promise<string>;
};

export async function fetchJson(
  url: string,
  init?: RequestInit,
): Promise<JsonFetchResponse> {
  const response = await globalThis.fetch(url, init);
  return response as unknown as JsonFetchResponse;
}
