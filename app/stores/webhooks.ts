import { ref, computed } from "vue";
import { defineStore } from "pinia";

export interface CapturedRequest {
  id: string;
  method: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Record<string, string>;
  body: string;
  contentType: string;
  size: number;
  ip: string;
  userAgent: string;
  createdAt: number;
  // false when the item came from the realtime listener (summary only); its
  // body/headers/query are fetched on demand when the request is opened.
  _full?: boolean;
}

export interface ResponseConfig {
  status: number;
  contentType: string;
  body: string;
}

export interface WebhookSummary {
  token: string;
  name: string;
  description: string;
  requestCount: number;
  lastRequest: { method: string; createdAt: number } | null;
  createdAt: number;
}

export interface WebhookDetail extends WebhookSummary {
  responseConfig: ResponseConfig;
  requests: CapturedRequest[];
}

export const useWebhooksStore = defineStore("webhooks", () => {
  const sessionId = ref<string | null>(null);
  const limit = ref(10);
  const used = ref(0);

  const webhooks = ref<WebhookSummary[]>([]);
  const selectedToken = ref<string | null>(null);
  const selectedDetail = ref<WebhookDetail | null>(null);
  const selectedRequestId = ref<string | null>(null);

  const search = ref("");
  const loading = ref(false);
  const loadingDetail = ref(false);
  const loadError = ref(false);
  const loadingRequest = ref(false);

  // Keep the client list aligned with the server-side cap so the in-memory
  // array can't grow without bound under a sustained live feed.
  const MAX_REQUESTS_PER_HOOK = 100;

  // Live-feed state. The browser subscribes (Firestore onSnapshot) to the SINGLE
  // webhook document it owns — no polling, no collection queries, 0 reads while
  // idle. The doc carries lightweight `recent` summaries; full bodies are
  // fetched on demand via the cookie-authenticated API.
  let streamToken: string | null = null;
  let unsubscribe: (() => void) | null = null;

  const selected = computed(() =>
    webhooks.value.find((w) => w.token === selectedToken.value) || null
  );

  const selectedRequest = computed(() => {
    if (!selectedDetail.value || !selectedRequestId.value) return null;
    return (
      selectedDetail.value.requests.find((r) => r.id === selectedRequestId.value) || null
    );
  });

  const filteredWebhooks = computed(() => {
    const s = search.value.trim().toLowerCase();
    if (!s) return webhooks.value;
    return webhooks.value.filter(
      (w) =>
        w.name.toLowerCase().includes(s) ||
        w.token.toLowerCase().includes(s) ||
        w.description.toLowerCase().includes(s)
    );
  });

  const atLimit = computed(() => used.value >= limit.value);

  async function loadSession() {
    loading.value = true;
    loadError.value = false;
    try {
      const data = await $fetch<{
        sessionId: string | null;
        limit: number;
        used: number;
        webhooks: WebhookSummary[];
      }>("/api/session");
      sessionId.value = data.sessionId;
      limit.value = data.limit;
      used.value = data.used;
      webhooks.value = data.webhooks;
      if (webhooks.value.length > 0 && !selectedToken.value) {
        await selectWebhook(webhooks.value[0]!.token);
      }
    } catch (e) {
      // Distinguish a real network failure from a genuinely empty session so the
      // UI can prompt a retry instead of silently showing the empty state.
      loadError.value = true;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function refreshList() {
    const data = await $fetch<{
      used: number;
      webhooks: WebhookSummary[];
    }>("/api/session");
    used.value = data.used;
    webhooks.value = data.webhooks;
  }

  async function createWebhook(input: { name?: string; description?: string } = {}) {
    // The POST response intentionally omits requests/lastRequest.
    const hook = await $fetch<
      Pick<
        WebhookDetail,
        "token" | "name" | "description" | "responseConfig" | "createdAt"
      >
    >("/api/webhooks", {
      method: "POST",
      body: input,
    });
    used.value += 1;
    const summary: WebhookSummary = {
      token: hook.token,
      name: hook.name,
      description: hook.description,
      requestCount: 0,
      lastRequest: null,
      createdAt: hook.createdAt,
    };
    webhooks.value.unshift(summary);
    await selectWebhook(hook.token);
    return summary;
  }

  async function selectWebhook(token: string) {
    selectedToken.value = token;
    selectedRequestId.value = null;
    loadingDetail.value = true;
    try {
      const detail = await $fetch<
        Pick<
          WebhookDetail,
          "token" | "name" | "description" | "responseConfig" | "createdAt"
        > & { requests: CapturedRequest[] }
      >(`/api/webhooks/${token}`);
      // A faster click may have switched the selection while this was in flight;
      // discard the stale response so detail/feed never point at the wrong hook.
      if (selectedToken.value !== token) return;
      // Requests from the API are complete (have bodies/headers).
      detail.requests.forEach((r) => {
        r._full = true;
      });
      selectedDetail.value = detail as WebhookDetail;
      if (detail.requests.length > 0) {
        selectedRequestId.value = detail.requests[0]!.id;
      }
      void openStream(token);
    } finally {
      if (selectedToken.value === token) loadingDetail.value = false;
    }
  }

  async function openStream(token: string) {
    closeStream();
    if (typeof window === "undefined") return;
    streamToken = token;

    const { $firebase } = useNuxtApp();
    if (!$firebase) return;

    // Wait for anonymous auth, then bind this webhook to our uid so the
    // Firestore rules authorize the listener. If auth is unavailable (provider
    // not enabled), we skip the live feed — initial requests already loaded.
    const uid = await $firebase.ready;
    if (!uid || streamToken !== token) return;
    try {
      const idToken = await $firebase.idToken();
      if (!idToken) return;
      await $fetch(`/api/webhooks/${token}/listen`, {
        method: "POST",
        headers: { authorization: `Bearer ${idToken}` },
      });
    } catch {
      return;
    }
    if (streamToken !== token) return;

    // Subscribe to the single owned document. `recent` summaries arrive in
    // realtime; we merge any we don't already have.
    unsubscribe = $firebase.subscribeWebhook(
      token,
      (data) => {
        if (streamToken !== token || !data) return;
        const detail = selectedDetail.value;
        if (!detail || detail.token !== token) return;
        const recent = Array.isArray(data.recent)
          ? (data.recent as CapturedRequest[])
          : [];
        // recent is newest-first; insert oldest-first so order stays correct.
        for (let i = recent.length - 1; i >= 0; i--) {
          const s = recent[i]!;
          if (detail.requests.some((r) => r.id === s.id)) continue;
          detail.requests.unshift({
            id: s.id,
            method: s.method,
            path: s.path,
            size: s.size,
            contentType: s.contentType,
            createdAt: s.createdAt,
            // Filled on demand when the request is opened.
            query: {},
            headers: {},
            body: "",
            ip: "",
            userAgent: "",
            _full: false,
          });
          if (detail.requests.length > MAX_REQUESTS_PER_HOOK) {
            detail.requests.splice(MAX_REQUESTS_PER_HOOK);
          }
          if (!selectedRequestId.value) selectedRequestId.value = s.id;
        }
        const summary = webhooks.value.find((w) => w.token === token);
        if (summary && typeof data.requestCount === "number") {
          summary.requestCount = data.requestCount;
          if (typeof data.lastRequestAt === "number") {
            summary.lastRequest = {
              method: data.lastRequestMethod ?? "",
              createdAt: data.lastRequestAt,
            };
          }
        }
      },
      () => {
        // Permission denied / network blip. Listener stays registered and
        // Firestore auto-retries; nothing else to do.
      }
    );
  }

  function closeStream() {
    streamToken = null;
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  }

  async function updateWebhook(
    token: string,
    patch: { name?: string; description?: string; responseConfig?: ResponseConfig }
  ) {
    const data = await $fetch<{
      token: string;
      name: string;
      description: string;
      responseConfig: ResponseConfig;
    }>(`/api/webhooks/${token}`, { method: "PATCH", body: patch });
    const summary = webhooks.value.find((w) => w.token === token);
    if (summary) {
      summary.name = data.name;
      summary.description = data.description;
    }
    if (selectedDetail.value?.token === token) {
      selectedDetail.value.name = data.name;
      selectedDetail.value.description = data.description;
      selectedDetail.value.responseConfig = data.responseConfig;
    }
  }

  async function deleteWebhook(token: string) {
    await $fetch(`/api/webhooks/${token}`, { method: "DELETE" });
    used.value = Math.max(0, used.value - 1);
    webhooks.value = webhooks.value.filter((w) => w.token !== token);
    if (selectedToken.value === token) {
      closeStream();
      selectedDetail.value = null;
      selectedRequestId.value = null;
      selectedToken.value = null;
      // Re-selecting the next webhook is a side effect of the delete; its fetch
      // failing must not turn a successful delete into a rejected promise.
      if (webhooks.value[0]) {
        try {
          await selectWebhook(webhooks.value[0].token);
        } catch {
          /* selection already cleared; surfaced separately if it matters */
        }
      }
    }
  }

  async function clearRequests(token: string) {
    await $fetch(`/api/webhooks/${token}/requests`, { method: "DELETE" });
    if (selectedDetail.value?.token === token) {
      selectedDetail.value.requests = [];
      selectedRequestId.value = null;
    }
    const s = webhooks.value.find((w) => w.token === token);
    if (s) {
      s.requestCount = 0;
      s.lastRequest = null;
    }
  }

  async function deleteRequest(token: string, requestId: string) {
    await $fetch(`/api/webhooks/${token}/requests/${requestId}`, {
      method: "DELETE",
    });
    if (selectedDetail.value?.token === token) {
      selectedDetail.value.requests = selectedDetail.value.requests.filter(
        (r) => r.id !== requestId
      );
      if (selectedRequestId.value === requestId) {
        selectedRequestId.value = selectedDetail.value.requests[0]?.id || null;
      }
    }
    const s = webhooks.value.find((w) => w.token === token);
    if (s) s.requestCount = Math.max(0, s.requestCount - 1);
  }

  async function selectRequest(id: string) {
    selectedRequestId.value = id;
    const detail = selectedDetail.value;
    if (!detail) return;
    const item = detail.requests.find((r) => r.id === id);
    // Items delivered by the realtime listener are summaries; fetch the full
    // payload (body/headers/query/ip/UA) on demand the first time it's opened.
    if (!item || item._full !== false) return;
    loadingRequest.value = true;
    try {
      const full = await $fetch<CapturedRequest>(
        `/api/webhooks/${detail.token}/requests/${id}`
      );
      const target = detail.requests.find((r) => r.id === id);
      if (target) Object.assign(target, full, { _full: true });
    } catch {
      // Leave it partial; the empty state is shown rather than stale data.
    } finally {
      loadingRequest.value = false;
    }
  }

  function publicUrl(token: string): string {
    if (typeof window === "undefined") return `/hook/${token}`;
    return `${window.location.origin}/hook/${token}`;
  }

  return {
    sessionId,
    limit,
    used,
    webhooks,
    selectedToken,
    selectedDetail,
    selectedRequestId,
    selected,
    selectedRequest,
    filteredWebhooks,
    atLimit,
    search,
    loading,
    loadingDetail,
    loadError,
    loadingRequest,
    loadSession,
    refreshList,
    createWebhook,
    selectWebhook,
    updateWebhook,
    deleteWebhook,
    clearRequests,
    deleteRequest,
    selectRequest,
    publicUrl,
    closeStream,
  };
});
