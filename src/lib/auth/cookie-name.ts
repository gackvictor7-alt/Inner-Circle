/**
 * Cookie names shared across the auth layer and the public site shell.
 *
 * Kept in its own module so the public site header (a client component) can
 * read the non-httpOnly presence flag WITHOUT dragging in the database-backed
 * session module (`session.ts` → drizzle, D1/libSQL).
 *
 *  * `SESSION_COOKIE`   – the opaque, httpOnly, SHA-256-hashed session token.
 *    Only the server can read it; it is the real authentication credential.
 *  * `AUTH_PRESENCE_COOKIE` – a non-httpOnly "is someone signed in?" flag that
 *    is set/cleared in lockstep with the session cookie. It carries NO identity
 *    and authorizes nothing; it only lets the STATICALLY pre-rendered public
 *    pages flip the header between "Login/Join" and "Zur App" after hydration
 *    (the httpOnly session cookie is invisible to both a static page and the
 *    browser). Real authorization always runs server-side on `/app`.
 */

export const SESSION_COOKIE = "ic_session";
export const AUTH_PRESENCE_COOKIE = "ic_presence";

