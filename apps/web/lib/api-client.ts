"use client";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(method === "POST" ? { "Idempotency-Key": crypto.randomUUID() } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error.message);
  return result.data;
}
