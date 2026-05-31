import type { FetchError } from "ofetch";

interface ApiErrorPayload {
  data?: {
    code?: string;
    params?: Record<string, unknown>;
  };
  statusMessage?: string;
  message?: string;
  status?: number;
  statusCode?: number;
}

export function useApiError() {
  const { t } = useI18n();

  function toMessage(err: unknown, fallbackKey = "errors.generic"): string {
    if (!err) return t(fallbackKey);
    const e = err as FetchError & ApiErrorPayload;
    const code = e?.data?.code;
    if (code) {
      const key = `errors.${code}`;
      const translated = t(key, e.data?.params);
      if (translated !== key) return translated;
    }
    if (e.statusMessage) return e.statusMessage;
    if (e.message && typeof e.message === "string" && !e.message.startsWith("[object")) {
      return e.message;
    }
    return t(fallbackKey);
  }

  return { toMessage };
}
