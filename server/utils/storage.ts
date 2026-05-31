import { randomBytes } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase";

export interface CapturedRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  size: number;
  ip: string;
  userAgent: string;
  createdAt: number;
}

export interface ResponseConfig {
  status: number;
  contentType: string;
  body: string;
}

// Lightweight per-request metadata kept on the webhook document (`recent`) so
// the owner's single-document realtime listener can render the live request
// list WITHOUT exposing bodies/headers/IPs to client-side Firestore. Full
// payloads live in the `requests` subcollection (server-only) and are fetched
// on demand through the cookie-authenticated API.
export interface RequestSummary {
  id: string;
  method: string;
  path: string;
  size: number;
  contentType: string;
  createdAt: number;
}

export const MAX_RECENT = 100;

export function toSummary(r: CapturedRequest): RequestSummary {
  return {
    id: r.id,
    method: r.method,
    path: r.path,
    size: r.size,
    contentType: r.contentType,
    createdAt: r.createdAt,
  };
}

export interface Webhook {
  token: string;
  sessionId: string;
  name: string;
  description: string;
  responseConfig: ResponseConfig;
  requests: CapturedRequest[];
  requestCount: number;
  createdAt: number;
}

export interface Session {
  id: string;
  createdAt: number;
}

export const MAX_WEBHOOKS_PER_SESSION = 10;
export const MAX_REQUESTS_PER_HOOK = 100;
export const MAX_BODY_SIZE = 1024 * 256;
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7;

// The owner-configured response is replayed verbatim from the app's own origin
// by the public /hook endpoint. Restricting the Content-Type to inert media
// types (combined with `nosniff` + a `sandbox` CSP on that response) prevents a
// webhook owner from serving active HTML/SVG/JS that would execute same-origin
// in a victim's browser. Anything not on this list is coerced to text/plain.
const INERT_CONTENT_TYPES = new Set([
  "application/json",
  "text/plain",
  "text/csv",
  "text/xml",
  "application/xml",
  "application/octet-stream",
  "application/yaml",
  "text/yaml",
  "application/x-www-form-urlencoded",
]);

export function sanitizeContentType(raw: unknown): string {
  // Strip control chars (incl. CR/LF) so the value can never break the HTTP
  // response header, then allow-list the base media type.
  const cleaned = (raw ?? "application/json")
    .toString()
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x1f\x7f]/g, "")
    .trim()
    .slice(0, 120);
  const base = cleaned.split(";")[0]!.trim().toLowerCase();
  if (INERT_CONTENT_TYPES.has(base)) return cleaned;
  return "text/plain";
}

// Concurrent floods on the public capture endpoint can transiently drift the
// stored requestCount; clamp it to a sane range whenever it is surfaced.
function clampCount(raw: unknown): number {
  const n = Number(raw) || 0;
  return Math.max(0, Math.min(MAX_REQUESTS_PER_HOOK, n));
}

export function newToken(): string {
  // 12 bytes = 96 bits of entropy. The /hook/<token> endpoint is public, so
  // tokens must be unguessable. 96 bits matches the strength of a UUIDv4.
  return randomBytes(12).toString("hex");
}

export function newSessionId(): string {
  return randomBytes(16).toString("hex");
}

export function newRequestId(): string {
  return randomBytes(6).toString("hex");
}

const ADJECTIVES = [
  "silent", "swift", "amber", "crimson", "lucky", "brave", "calm", "bold",
  "fuzzy", "neon", "quiet", "fierce", "happy", "lazy", "shy",
];
const NOUNS = [
  "panda", "falcon", "river", "comet", "ember", "orchid", "willow", "tiger",
  "harbor", "echo", "lotus", "raven", "spruce", "atlas", "nova",
];

export function suggestName(): string {
  const a = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const n = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${a}-${n}-${num}`;
}

function sessionExpiresAt(createdAt: number): Timestamp {
  return Timestamp.fromMillis(createdAt + SESSION_TTL_MS);
}

export async function getOrCreateSession(sessionId: string | undefined): Promise<Session> {
  const fs = db();
  if (sessionId) {
    const snap = await fs.collection("sessions").doc(sessionId).get();
    if (snap.exists) {
      const data = snap.data()!;
      return { id: sessionId, createdAt: data.createdAt };
    }
  }
  const id = newSessionId();
  const createdAt = Date.now();
  await fs.collection("sessions").doc(id).set({
    id,
    createdAt,
    expiresAt: sessionExpiresAt(createdAt),
  });
  return { id, createdAt };
}

export async function getStoredSession(sessionId: string | undefined): Promise<Session | undefined> {
  if (!sessionId) return undefined;
  const snap = await db().collection("sessions").doc(sessionId).get();
  if (!snap.exists) return undefined;
  const data = snap.data()!;
  return { id: sessionId, createdAt: data.createdAt };
}

interface WebhookSummary {
  token: string;
  name: string;
  description: string;
  requestCount: number;
  lastRequest: { method: string; createdAt: number } | null;
  createdAt: number;
}

export async function listWebhooksForSession(sessionId: string): Promise<WebhookSummary[]> {
  const snap = await db()
    .collection("webhooks")
    .where("sessionId", "==", sessionId)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return {
      token: data.token,
      name: data.name,
      description: data.description,
      requestCount: clampCount(data.requestCount),
      lastRequest: data.lastRequestAt
        ? { method: data.lastRequestMethod ?? "", createdAt: data.lastRequestAt }
        : null,
      createdAt: data.createdAt,
    };
  });
}

export async function createWebhookForSession(
  sessionId: string,
  input: { name?: string; description?: string }
): Promise<{ ok: true; webhook: Webhook } | { ok: false; reason: "limit" | "session" }> {
  const fs = db();
  const sessionRef = fs.collection("sessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) return { ok: false, reason: "session" };

  const countSnap = await fs
    .collection("webhooks")
    .where("sessionId", "==", sessionId)
    .count()
    .get();
  if (countSnap.data().count >= MAX_WEBHOOKS_PER_SESSION) {
    return { ok: false, reason: "limit" };
  }

  const token = newToken();
  const createdAt = Date.now();
  const sessionCreatedAt = sessionSnap.data()!.createdAt as number;
  const webhook: Omit<Webhook, "requests"> & {
    expiresAt: Timestamp;
    ownerUid: string | null;
    recent: RequestSummary[];
  } = {
    token,
    sessionId,
    // Bound to the creator's anonymous uid on first listen; until then the
    // Firestore rules deny all client reads of this document.
    ownerUid: null,
    name: (input.name?.trim() || suggestName()).slice(0, 64),
    description: (input.description?.trim() || "").slice(0, 200),
    responseConfig: {
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }, null, 2),
    },
    requestCount: 0,
    recent: [],
    createdAt,
    expiresAt: sessionExpiresAt(sessionCreatedAt),
  };
  await fs.collection("webhooks").doc(token).set(webhook);
  return { ok: true, webhook: { ...webhook, requests: [] } as Webhook };
}

async function loadRequests(token: string): Promise<CapturedRequest[]> {
  const snap = await db()
    .collection("webhooks")
    .doc(token)
    .collection("requests")
    .orderBy("createdAt", "desc")
    .limit(MAX_REQUESTS_PER_HOOK)
    .get();
  return snap.docs.map((d) => {
    // Drop the internal TTL field so it never reaches the client.
    const { expiresAt, ...rest } = d.data() as CapturedRequest & {
      expiresAt?: unknown;
    };
    void expiresAt;
    return rest as CapturedRequest;
  });
}

export async function getWebhook(token: string): Promise<Webhook | undefined> {
  if (!isValidToken(token)) return undefined;
  const snap = await db().collection("webhooks").doc(token).get();
  if (!snap.exists) return undefined;
  const data = snap.data()!;
  return {
    token: data.token,
    sessionId: data.sessionId,
    name: data.name,
    description: data.description,
    responseConfig: data.responseConfig,
    requestCount: clampCount(data.requestCount),
    createdAt: data.createdAt,
    requests: [],
  };
}

export async function getWebhookForSession(
  sessionId: string,
  token: string
): Promise<Webhook | undefined> {
  const hook = await getWebhook(token);
  if (!hook || hook.sessionId !== sessionId) return undefined;
  hook.requests = await loadRequests(token);
  return hook;
}

export async function updateWebhook(
  sessionId: string,
  token: string,
  patch: Partial<Pick<Webhook, "name" | "description" | "responseConfig">>
): Promise<Webhook | undefined> {
  if (!isValidToken(token)) return undefined;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists) return undefined;
  const current = snap.data()!;
  if (current.sessionId !== sessionId) return undefined;

  const next: Record<string, unknown> = {};
  if (patch.name !== undefined) {
    next.name = patch.name.trim().slice(0, 64) || current.name;
  }
  if (patch.description !== undefined) {
    next.description = String(patch.description).slice(0, 200);
  }
  if (patch.responseConfig) {
    const rc = patch.responseConfig;
    next.responseConfig = {
      status: Math.min(599, Math.max(100, Number(rc.status) || 200)),
      contentType: sanitizeContentType(rc.contentType),
      body: (rc.body ?? "").toString().slice(0, MAX_BODY_SIZE),
    };
  }

  if (Object.keys(next).length > 0) {
    await ref.update(next);
  }
  const updated = { ...current, ...next };
  return {
    token: updated.token,
    sessionId: updated.sessionId,
    name: updated.name,
    description: updated.description,
    responseConfig: updated.responseConfig,
    requestCount: clampCount(updated.requestCount),
    createdAt: updated.createdAt,
    requests: await loadRequests(token),
  };
}

export async function deleteWebhook(sessionId: string, token: string): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.sessionId !== sessionId) return false;
  await fs.recursiveDelete(ref);
  return true;
}

export async function clearRequests(sessionId: string, token: string): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.sessionId !== sessionId) return false;
  await fs.recursiveDelete(ref.collection("requests"));
  await ref.update({
    requestCount: 0,
    recent: [],
    lastRequestAt: FieldValue.delete(),
    lastRequestMethod: FieldValue.delete(),
  });
  return true;
}

export async function deleteRequest(
  sessionId: string,
  token: string,
  requestId: string
): Promise<boolean> {
  if (!isValidToken(token) || !isValidRequestId(requestId)) return false;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.sessionId !== sessionId) return false;
  const data = snap.data()!;
  const reqRef = ref.collection("requests").doc(requestId);
  const reqSnap = await reqRef.get();
  if (!reqSnap.exists) return false;
  await reqRef.delete();
  const recent = (Array.isArray(data.recent) ? data.recent : []).filter(
    (s: RequestSummary) => s.id !== requestId
  );
  await ref.update({ requestCount: FieldValue.increment(-1), recent });
  return true;
}

// Binds a webhook to the caller's anonymous uid so Firestore rules let that uid
// (and only that uid) read the document. The cookie session must already own
// the webhook — this is called from the cookie-authenticated /listen endpoint.
export async function setWebhookOwner(
  sessionId: string,
  token: string,
  ownerUid: string
): Promise<boolean> {
  if (!isValidToken(token)) return false;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.sessionId !== sessionId) return false;
  if (snap.data()!.ownerUid !== ownerUid) {
    await ref.update({ ownerUid });
  }
  return true;
}

// Full single request, fetched on demand (cookie-authenticated). Request bodies
// are never exposed through client-side Firestore — only through this path.
export async function getRequestForSession(
  sessionId: string,
  token: string,
  requestId: string
): Promise<CapturedRequest | undefined> {
  if (!isValidToken(token) || !isValidRequestId(requestId)) return undefined;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.sessionId !== sessionId) return undefined;
  const reqSnap = await ref.collection("requests").doc(requestId).get();
  if (!reqSnap.exists) return undefined;
  const { expiresAt, ...rest } = reqSnap.data() as CapturedRequest & {
    expiresAt?: unknown;
  };
  void expiresAt;
  return rest as CapturedRequest;
}

export async function captureRequest(
  token: string,
  req: CapturedRequest
): Promise<Webhook | undefined> {
  if (!isValidToken(token)) return undefined;
  const fs = db();
  const ref = fs.collection("webhooks").doc(token);
  const snap = await ref.get();
  if (!snap.exists) return undefined;
  const data = snap.data()!;

  // Stamp each request with the parent webhook's TTL so Firestore's TTL policy
  // reaps request docs independently. Firestore TTL only deletes the matched
  // document, never its parent's subcollections, so without a per-request TTL
  // these would be orphaned forever when the webhook doc expires.
  const expiresAt =
    (data.expiresAt as Timestamp | undefined) ?? sessionExpiresAt(data.createdAt);
  await ref.collection("requests").doc(req.id).set({ ...req, expiresAt });

  // Prepend a lightweight summary to `recent` (capped) so the owner's
  // single-document realtime listener gets the new request instantly without
  // any collection query and without exposing the body/headers.
  const prevRecent: RequestSummary[] = Array.isArray(data.recent) ? data.recent : [];
  const recent = [toSummary(req), ...prevRecent].slice(0, MAX_RECENT);
  await ref.update({
    requestCount: FieldValue.increment(1),
    lastRequestAt: req.createdAt,
    lastRequestMethod: req.method,
    recent,
  });

  // Cap at MAX_REQUESTS_PER_HOOK by pruning the oldest. The /hook/<token>
  // endpoint is public, so an attacker can flood it; the cap bounds storage
  // and listing cost per webhook.
  const newCount = (data.requestCount ?? 0) + 1;
  if (newCount > MAX_REQUESTS_PER_HOOK) {
    const excess = newCount - MAX_REQUESTS_PER_HOOK;
    const oldest = await ref
      .collection("requests")
      .orderBy("createdAt", "asc")
      .limit(excess)
      .get();
    const batch = fs.batch();
    for (const doc of oldest.docs) batch.delete(doc.ref);
    batch.update(ref, { requestCount: FieldValue.increment(-excess) });
    await batch.commit();
  }

  return {
    token: data.token,
    sessionId: data.sessionId,
    name: data.name,
    description: data.description,
    responseConfig: data.responseConfig,
    requestCount: Math.min(newCount, MAX_REQUESTS_PER_HOOK),
    createdAt: data.createdAt,
    requests: [],
  };
}

const TOKEN_RE = /^[0-9a-f]{16,32}$/;
const REQUEST_ID_RE = /^[0-9a-f]{12}$/;

function isValidToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

function isValidRequestId(id: string): boolean {
  return REQUEST_ID_RE.test(id);
}
