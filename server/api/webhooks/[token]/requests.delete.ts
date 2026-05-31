import { resolveSession } from "../../../utils/session";
import { apiError } from "../../../utils/errors";
import { clearRequests } from "../../../utils/storage";

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  const ok = !!session && (await clearRequests(session.id, token));
  if (!ok) {
    throw apiError("webhook.not_found");
  }
  return { ok: true };
});
