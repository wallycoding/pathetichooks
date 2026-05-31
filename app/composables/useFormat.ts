export function useFormat() {
  const { t } = useI18n();

  function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 1000) return t("format.now");
    const s = Math.floor(diff / 1000);
    if (s < 60) return t("format.secondsAgo", { n: s });
    const m = Math.floor(s / 60);
    if (m < 60) return t("format.minutesAgo", { n: m });
    const h = Math.floor(m / 60);
    if (h < 24) return t("format.hoursAgo", { n: h });
    const d = Math.floor(h / 24);
    return t("format.daysAgo", { n: d });
  }

  function formatBytes(n: number): string {
    if (n < 1024) return t("format.bytes", { n });
    if (n < 1024 * 1024) return t("format.kilobytes", { n: (n / 1024).toFixed(1) });
    return t("format.megabytes", { n: (n / 1024 / 1024).toFixed(1) });
  }

  function methodClass(method: string): string {
    const m = method.toUpperCase();
    if (m === "GET") return "method-pill method-get";
    if (m === "POST") return "method-pill method-post";
    if (m === "PUT") return "method-pill method-put";
    if (m === "PATCH") return "method-pill method-patch";
    if (m === "DELETE") return "method-pill method-delete";
    return "method-pill method-other";
  }

  function tryPrettyJson(body: string, contentType: string): string | null {
    if (!body) return null;
    if (
      !contentType.toLowerCase().includes("json") &&
      !body.trim().startsWith("{") &&
      !body.trim().startsWith("[")
    ) {
      return null;
    }
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return null;
    }
  }

  return { relativeTime, formatBytes, methodClass, tryPrettyJson };
}
