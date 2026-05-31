export type ErrorCode =
  | "webhook.not_found"
  | "webhook.limit_reached"
  | "webhook.token_missing"
  | "session.invalid"
  | "request.not_found";

const FALLBACK_MESSAGE: Record<ErrorCode, string> = {
  "webhook.not_found": "Webhook not found",
  "webhook.limit_reached": "Webhook limit reached",
  "webhook.token_missing": "Missing token in URL",
  "session.invalid": "Invalid session",
  "request.not_found": "Request not found",
};

const STATUS: Record<ErrorCode, number> = {
  "webhook.not_found": 404,
  "webhook.limit_reached": 409,
  "webhook.token_missing": 400,
  "session.invalid": 400,
  "request.not_found": 404,
};

export function apiError(code: ErrorCode, params?: Record<string, unknown>) {
  return createError({
    statusCode: STATUS[code],
    statusMessage: FALLBACK_MESSAGE[code],
    data: { code, params: params ?? {} },
  });
}
