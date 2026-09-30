"use client";

import { useSyncExternalStore } from "react";
import { AUTH_PRESENCE_COOKIE } from "./cookie-name";

/**
 * Client-only "is someone signed in?" signal for the public site header.
 *
 * The public pages are statically pre-rendered (no cookies() on the server),
 * so the header renders the visitor state first and re-evaluates right after
 * hydration. The `ic_presence` cookie is a NON-httpOnly flag without any
 * identity, kept in lockstep with the real httpOnly session cookie by the
 * session layer. It authorizes nothing – it only switches the header between
 * "Login/Join" and "Zur App".
 */
export function useSignedInPresence(): boolean {
  // The cookie is read on the client only; the server snapshot is the visitor
  // state, so hydration stays consistent and the flag applies right after it.
  return useSyncExternalStore(subscribeNever, readPresenceCookie, () => false);
}

/** The presence cookie does not notify; it is re-read on every render. */
function subscribeNever(): () => void {
  return () => {};
}

/** Reads the presence flag directly from `document.cookie` (no dependency). */
export function readPresenceCookie(): boolean {
  try {
    const entries = document.cookie.split(";");
    for (const entry of entries) {
      const separator = entry.indexOf("=");
      if (separator === -1) continue;
      const name = entry.slice(0, separator).trim();
      if (name === AUTH_PRESENCE_COOKIE) {
        return entry.slice(separator + 1).trim().length > 0;
      }
    }
  } catch {
    return false;
  }
  return false;
}
