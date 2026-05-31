import { resolveSession } from "../../utils/session";
import { apiError } from "../../utils/errors";
import { getWebhookForSession } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  const hook = session && (await getWebhookForSession(session.id, token));
  if (!hook) {
    throw apiError("webhook.not_found");
  }
  return {
    token: hook.token,
    name: hook.name,
    description: hook.description,
    responseConfig: hook.responseConfig,
    createdAt: hook.createdAt,
    requests: hook.requests,
  };
});
