/**
 * Minimal `next/headers` double for integration tests. Tests can set the
 * request headers through `__setTestHeaders`.
 *
 * The header store lives on `globalThis` so it survives `vi.resetModules()`
 * (tests that re-import the server actions with a different environment
 * would otherwise talk to a fresh, empty stub).
 */
type Store = { headers: Record<string, string> };

const STORE_KEY = "__innerCircleTestHeaders" as const;
const store: Store = ((globalThis as Record<string, unknown>)[STORE_KEY] as Store | undefined) ?? { headers: {} };
(globalThis as Record<string, unknown>)[STORE_KEY] = store;

export function __setTestHeaders(headers: Record<string, string>) {
  store.headers = Object.fromEntries(Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value]));
}

export async function headers() {
  return {
    get: (key: string) => store.headers[key.toLowerCase()] ?? null,
  };
}

export async function cookies() {
  return {
    get: () => undefined,
    set: () => undefined,
    delete: () => undefined,
  };
}
