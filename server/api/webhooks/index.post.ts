import { ensureSession } from "../../utils/session";
import { apiError } from "../../utils/errors";
import {
  createWebhookForSession,
  MAX_WEBHOOKS_PER_SESSION,
} from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const session = await ensureSession(event);
  const body = await readBody<{ name?: string; description?: string }>(event).catch(
    () => ({})
  );
  const result = await createWebhookForSession(session.id, body || {});
  if (!result.ok) {
    if (result.reason === "limit") {
      throw apiError("webhook.limit_reached", { limit: MAX_WEBHOOKS_PER_SESSION });
    }
    throw apiError("session.invalid");
  }
  const h = result.webhook;
  return {
    token: h.token,
    name: h.name,
    description: h.description,
    responseConfig: h.responseConfig,
    requestCount: 0,
    createdAt: h.createdAt,
  };
});
