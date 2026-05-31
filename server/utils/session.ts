import type { H3Event } from "h3";
import { getOrCreateSession, getStoredSession, type Session } from "./storage";

// Firebase Hosting strips all cookies except `__session` before forwarding to
// Cloud Functions (CDN cache optimization). Using any other name silently
// loses the cookie in production.
// https://firebase.google.com/docs/hosting/manage-cache#using_cookies
const COOKIE = "__session";
// `import.meta.dev` is statically replaced by Nitro (false in the production
// build), so the Secure flag is reliably set on deployed HTTPS responses
// regardless of the runtime NODE_ENV, while still allowing the cookie over
// http on localhost during development.
const isDev = import.meta.dev;
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: !isDev,
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

const SESSION_ID_RE = /^[0-9a-f]{32}$/;

function sanitizeId(raw: string | undefined): string | undefined {
  return raw && SESSION_ID_RE.test(raw) ? raw : undefined;
}

/**
 * For state-changing endpoints (webhook creation): returns the existing session
 * or creates a fresh one and sets the cookie. This is the ONLY path that ever
 * persists a session document, so anonymous read traffic cannot amplify writes.
 */
export async function ensureSession(event: H3Event): Promise<Session> {
  const existing = sanitizeId(getCookie(event, COOKIE));
  const session = await getOrCreateSession(existing);
  if (existing !== session.id) {
    setCookie(event, COOKIE, session.id, COOKIE_OPTS);
  }
  return session;
}

/**
 * For read/ownership endpoints: resolves the session from the cookie WITHOUT
 * creating one. A missing/invalid cookie returns undefined, so the caller is
 * treated as owning nothing and no Firestore write happens.
 */
export async function resolveSession(event: H3Event): Promise<Session | undefined> {
  const id = sanitizeId(getCookie(event, COOKIE));
  if (!id) return undefined;
  return getStoredSession(id);
}

export function readSessionId(event: H3Event): string | undefined {
  return sanitizeId(getCookie(event, COOKIE));
}
