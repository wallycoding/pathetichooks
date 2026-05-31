import { resolveSession } from "../../../../utils/session";
import { apiError } from "../../../../utils/errors";
import { getRequestForSession } from "../../../../utils/storage";

// On-demand full request (body, headers, query, IP, UA). The realtime listener
// only carries lightweight summaries; the client fetches the full payload here
// when the owner opens a request. Cookie-authenticated and ownership-checked.
export default defineEventHandler(async (event) => {
  const session = await resolveSession(event);
  const token = getRouterParam(event, "token")!;
  const id = getRouterParam(event, "id")!;
  const request = session && (await getRequestForSession(session.id, token, id));
  if (!request) {
    throw apiError("request.not_found");
  }
  return request;
});
