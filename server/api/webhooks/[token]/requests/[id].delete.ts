import { resolveSession } from "../../../../utils/session";
import { apiError } from "../../../../utils/errors";
import { deleteRequest } from "../../../../utils/storage";

export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  const id = getRouterParam(event, "id")!;
  const ok = !!session && (await deleteRequest(session.id, token, id));
  if (!ok) {
    throw apiError("request.not_found");
  }
  return { ok: true };
});
