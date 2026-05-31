import { resolveSession } from "../../utils/session";
import { apiError } from "../../utils/errors";
import { updateWebhook } from "../../utils/storage";

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  const body = await readBody<{
    name?: string;
    description?: string;
    responseConfig?: { status: number; contentType: string; body: string };
  }>(event);
  const hook = session && (await updateWebhook(session.id, token, body || {}));
  if (!hook) {
    throw apiError("webhook.not_found");
  }
  return {
    token: hook.token,
    name: hook.name,
    description: hook.description,
    responseConfig: hook.responseConfig,
  };
});
