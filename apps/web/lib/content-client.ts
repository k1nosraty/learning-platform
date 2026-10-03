import type { ContentIssue } from "../../../packages/contracts/src/content";

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public details: ContentIssue[] = [],
  ) {
    super(message);
  }
}
export async function contentApi<T>(
  url: string,
  method = "GET",
  body?: unknown,
  key?: string,
): Promise<T> {
  const response = await fetch(url, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : body !== undefined
          ? { "Content-Type": "application/json" }
          : {}),
      ...(key ? { "Idempotency-Key": key } : {}),
    },
    ...(body !== undefined
      ? { body: body instanceof FormData ? body : JSON.stringify(body) }
      : {}),
  });
  const result = await response.json();
  if (!response.ok)
    throw new ApiError(
      result.error?.message ?? "Request failed",
      result.error?.code ?? "INTERNAL_ERROR",
      result.error?.details ?? [],
    );
  return result.data as T;
}
