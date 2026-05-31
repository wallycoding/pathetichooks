import { resolveSession } from "../utils/session";
import { listWebhooksForSession, MAX_WEBHOOKS_PER_SESSION } from "../utils/storage";

export default defineEventHandler(async (event) => {
  // Read-only: never create a session for anonymous page loads / crawlers, so
  // unauthenticated traffic cannot amplify Firestore writes. A session is first
  // persisted only when the user creates a webhook (POST /api/webhooks).
  const session = await resolveSession(event);
  if (!session) {
    return {
      sessionId: null,
      limit: MAX_WEBHOOKS_PER_SESSION,
      used: 0,
      webhooks: [],
    };
  }
  const hooks = await listWebhooksForSession(session.id);
  return {
    sessionId: session.id,
    limit: MAX_WEBHOOKS_PER_SESSION,
    used: hooks.length,
    webhooks: hooks,
  };
});
