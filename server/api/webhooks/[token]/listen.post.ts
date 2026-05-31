import { resolveSession } from "../../../utils/session";
import { apiError } from "../../../utils/errors";
import { setWebhookOwner } from "../../../utils/storage";
import { auth } from "../../../utils/firebase";

// Binds the webhook to the caller's anonymous Firebase uid so the client's
// single-document realtime listener is authorized by the Firestore rules.
// Requires BOTH the cookie session (proves webhook ownership) and a valid
// Firebase ID token (proves the uid) — an attacker can do neither for someone
// else's webhook.
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  if (!session) {
    throw apiError("webhook.not_found");
  }

  const header = getRequestHeader(event, "authorization") || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!idToken) {
    throw apiError("session.invalid");
  }

  let uid: string;
  try {
    const decoded = await auth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    throw apiError("session.invalid");
  }

  const ok = await setWebhookOwner(session.id, token, uid);
  if (!ok) {
    throw apiError("webhook.not_found");
  }
  return { ok: true };
});
