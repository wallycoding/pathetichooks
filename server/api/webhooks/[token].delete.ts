import { resolveSession } from "../../utils/session";
import { apiError } from "../../utils/errors";
import { deleteWebhook } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  const ok = !!session && (await deleteWebhook(session.id, token));
  if (!ok) {
    throw apiError("webhook.not_found");
  }
  return { ok: true };
});
