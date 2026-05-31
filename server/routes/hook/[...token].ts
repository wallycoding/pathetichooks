import { apiError } from "../../utils/errors";
import {
  captureRequest,
  getWebhook,
  MAX_BODY_SIZE,
  newRequestId,
  type CapturedRequest,
} from "../../utils/storage";

// Captured header/query names become Firestore map field names. Firestore
// rejects empty field names and names matching the reserved /^__.*__$/ pattern,
// which would otherwise throw and turn a crafted request (e.g. `?=x` or a
// `__proto__` header) into an unhandled 500 instead of the configured response.
function isStorableKey(key: string): boolean {
  return key.length > 0 && !/^__.*__$/.test(key);
}

// Strip control chars (incl. CR/LF) so a legacy/un-sanitized stored Content-Type
// can never break the response header or smuggle additional headers.
function safeHeaderValue(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, "").slice(0, 120);
}

export default defineEventHandler(async (event) => {
  const fullPath = getRouterParam(event, "token") ?? "";
  const [token, ...rest] = fullPath.split("/");
  if (!token) {
    throw apiError("webhook.token_missing");
  }
  const hook = await getWebhook(token);
  if (!hook) {
    throw apiError("webhook.not_found");
  }

  const method = event.method || "GET";
  const headers: Record<string, string> = {};
  let headersBytes = 0;
  for (const [k, v] of Object.entries(getRequestHeaders(event))) {
    if (typeof v !== "string") continue;
    const key = k.toLowerCase();
    if (!isStorableKey(key)) continue;
    // Cap header storage to ~16KB to bound document size against malicious
    // clients that send pathological header sets.
    if (headersBytes + key.length + v.length > 16 * 1024) continue;
    headers[key] = v;
    headersBytes += key.length + v.length;
  }

  const query: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(
    getQuery(event) as Record<string, string | string[]>
  )) {
    if (!isStorableKey(k)) continue;
    query[k] = v;
  }

  let body = "";
  let size = 0;
  if (method !== "GET" && method !== "HEAD") {
    // Reject oversized bodies up front so we neither decode nor store more than
    // the cap. The platform may still buffer the raw request, but the function
    // is provisioned with enough memory and this avoids the extra utf8 copy and
    // a doomed Firestore write.
    const declared = Number(getRequestHeader(event, "content-length"));
    if (Number.isFinite(declared) && declared > MAX_BODY_SIZE) {
      size = declared;
    } else {
      const raw = await readRawBody(event, "utf8").catch(() => "");
      body = typeof raw === "string" ? raw : "";
      if (body.length > MAX_BODY_SIZE) body = body.slice(0, MAX_BODY_SIZE);
      size = body.length;
    }
  }

  const forwarded = headers["x-forwarded-for"]?.split(",")[0]?.trim();
  const ip =
    forwarded || event.node.req.socket?.remoteAddress?.replace("::ffff:", "") || "";

  const captured: CapturedRequest = {
    id: newRequestId(),
    method,
    path: rest.length > 0 ? "/" + rest.join("/") : "/",
    query,
    headers,
    body,
    contentType: (headers["content-type"] || "").slice(0, 200),
    size,
    ip,
    userAgent: (headers["user-agent"] || "").slice(0, 500),
    createdAt: Date.now(),
  };

  // Best-effort capture: a webhook receiver must still answer its caller even
  // if persistence hiccups, so a storage error never becomes a 500.
  try {
    await captureRequest(token, captured);
  } catch (err) {
    console.error(`[hook] capture failed for ${token}:`, err);
  }

  setResponseStatus(event, hook.responseConfig.status);
  setResponseHeader(
    event,
    "content-type",
    safeHeaderValue(hook.responseConfig.contentType || "application/json") ||
      "application/json"
  );
  // Neutralize the owner-controlled body on the app's own origin: nosniff stops
  // content-type sniffing into active content, and the `sandbox` CSP loads the
  // response in a unique opaque origin so any HTML/JS cannot touch the app's
  // cookies, storage, or same-origin /api/* endpoints.
  setResponseHeader(event, "x-content-type-options", "nosniff");
  setResponseHeader(
    event,
    "content-security-policy",
    "sandbox; default-src 'none'; frame-ancestors 'none'"
  );
  setResponseHeader(event, "x-frame-options", "DENY");
  setResponseHeader(event, "referrer-policy", "no-referrer");
  setResponseHeader(event, "x-pathetic-hook", "captured");
  return hook.responseConfig.body;
});
