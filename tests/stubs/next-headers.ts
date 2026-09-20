/**
 * Minimal `next/headers` double for integration tests. Tests can set the
 * request headers through `__setTestHeaders`.
 */
let current: Record<string, string> = {};

export function __setTestHeaders(headers: Record<string, string>) {
  current = headers;
}

export async function headers() {
  return {
    get: (key: string) => current[key.toLowerCase()] ?? null,
  };
}

export async function cookies() {
  return {
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  };
}
