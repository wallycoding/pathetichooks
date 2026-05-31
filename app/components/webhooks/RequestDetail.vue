<script setup lang="ts">
import { Copy, Inbox, Globe, Network, Clock, FileCode, Hash, Loader2 } from "lucide-vue-next";
import { toast } from "vue-sonner";

const store = useWebhooksStore();
const { methodClass, formatBytes, tryPrettyJson, relativeTime } = useFormat();
const { t } = useI18n();

const req = computed(() => store.selectedRequest);

const prettyBody = computed(() => {
  if (!req.value) return null;
  return tryPrettyJson(req.value.body, req.value.contentType);
});

const isJsonBody = computed(() => prettyBody.value !== null);

const headerEntries = computed(() => {
  if (!req.value) return [] as [string, string][];
  return Object.entries(req.value.headers).sort(([a], [b]) => a.localeCompare(b));
});

const queryEntries = computed(() => {
  if (!req.value) return [] as [string, string | string[]][];
  return Object.entries(req.value.query);
});

const rawDump = computed(() => {
  if (!req.value) return "";
  const r = req.value;
  const qs = Object.keys(r.query).length
    ? "?" +
      Object.entries(r.query)
        .map(([k, v]) =>
          Array.isArray(v) ? v.map((vv) => `${k}=${vv}`).join("&") : `${k}=${v}`
        )
        .join("&")
    : "";
  return [
    `${r.method} ${r.path}${qs} HTTP/1.1`,
    ...Object.entries(r.headers).map(([k, v]) => `${k}: ${v}`),
    "",
    r.body || "",
  ].join("\n");
});

const fullTime = computed(() =>
  req.value
    ? new Date(req.value.createdAt).toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "medium",
      })
    : ""
);

async function copy(text: string, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
  } catch {
    toast.error(t("requestDetail.copyFailed"));
  }
}
</script>

<template>
  <div class="panel flex h-full min-h-0 flex-col overflow-hidden">
    <div
      v-if="store.loadingRequest"
      class="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[2px]"
    >
      <Loader2 class="size-5 animate-spin text-[color:var(--acc-strong)]" />
    </div>
    <div
      v-if="!req"
      class="flex h-full flex-col items-center justify-center gap-4 px-8 py-12 text-center"
    >
      <div
        class="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-muted/40 text-muted-foreground"
      >
        <Inbox class="size-7" />
      </div>
      <div class="space-y-1.5">
        <h3 class="text-base font-semibold tracking-tight">
          {{ t("requestDetail.emptyTitle") }}
        </h3>
        <p class="max-w-sm text-sm text-muted-foreground">
          {{ t("requestDetail.emptyDesc") }}
        </p>
      </div>
    </div>

    <div v-else class="flex h-full min-h-0 flex-col">
      <div class="panel-header">
        <span class="label">request</span>
        <span class="font-mono text-[12px] text-muted-foreground/70">#{{ req.id }}</span>
        <span class="ml-auto text-[12px] font-normal text-muted-foreground">{{ fullTime }}</span>
      </div>

      <header class="border-b border-border px-4 py-3">
        <div class="flex flex-wrap items-center gap-3">
          <span :class="methodClass(req.method)" class="!px-2 !py-1 !text-[12px]">
            {{ req.method }}
          </span>
          <code class="font-mono text-[14px] text-foreground">{{ req.path }}</code>
          <div class="ml-auto flex items-center gap-3 font-mono text-[12px] text-muted-foreground">
            <span class="inline-flex items-center gap-1">
              <Clock class="size-3" /> {{ relativeTime(req.createdAt) }}
            </span>
            <span class="inline-flex items-center gap-1">
              <Hash class="size-3" /> {{ formatBytes(req.size) }}
            </span>
          </div>
        </div>

        <div class="mt-3 grid gap-2 font-mono text-[12px] sm:grid-cols-3">
          <div class="flex items-start gap-2 rounded-lg border border-border/70 bg-background/40 px-2.5 py-2">
            <FileCode class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div class="min-w-0">
              <div class="text-[11px] uppercase tracking-wider text-muted-foreground">
                {{ t("requestDetail.contentType") }}
              </div>
              <div class="mt-0.5 truncate text-foreground">
                {{ req.contentType || "—" }}
              </div>
            </div>
          </div>
          <div class="flex items-start gap-2 rounded-lg border border-border/70 bg-background/40 px-2.5 py-2">
            <Network class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div class="min-w-0">
              <div class="text-[11px] uppercase tracking-wider text-muted-foreground">
                {{ t("requestDetail.sourceIp") }}
              </div>
              <div class="mt-0.5 truncate text-foreground">{{ req.ip || "—" }}</div>
            </div>
          </div>
          <div class="flex items-start gap-2 rounded-lg border border-border/70 bg-background/40 px-2.5 py-2">
            <Globe class="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
            <div class="min-w-0">
              <div class="text-[11px] uppercase tracking-wider text-muted-foreground">
                {{ t("requestDetail.userAgent") }}
              </div>
              <div class="mt-0.5 truncate text-foreground" :title="req.userAgent">
                {{ req.userAgent || "—" }}
              </div>
            </div>
          </div>
        </div>
      </header>

      <Tabs default-value="body" class="flex min-h-0 flex-1 flex-col">
        <div class="border-b border-border px-4 pt-2.5 pb-2.5">
          <TabsList>
            <TabsTrigger value="body">{{ t("requestDetail.tabBody") }}</TabsTrigger>
            <TabsTrigger value="headers">
              {{ t("requestDetail.tabHeaders") }}
              <span
                class="ml-1.5 rounded bg-muted px-1 py-px text-[10px] tabular-nums opacity-80"
              >
                {{ headerEntries.length }}
              </span>
            </TabsTrigger>
            <TabsTrigger value="query">
              {{ t("requestDetail.tabQuery") }}
              <span
                class="ml-1.5 rounded bg-muted px-1 py-px text-[10px] tabular-nums opacity-80"
              >
                {{ queryEntries.length }}
              </span>
            </TabsTrigger>
            <TabsTrigger value="raw">{{ t("requestDetail.tabRaw") }}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="body"
          class="flex min-h-0 flex-1 flex-col px-4 pb-5 pt-3"
        >
          <div class="flex items-center justify-between pb-2">
            <div class="flex items-center gap-2">
              <Badge v-if="isJsonBody" variant="info" class="font-mono">
                {{ t("requestDetail.jsonBadge") }}
              </Badge>
              <Badge v-else-if="req.body" variant="secondary" class="font-mono">
                {{ req.contentType?.split(";")[0] || t("requestDetail.rawBadge") }}
              </Badge>
              <span class="text-[11px] text-muted-foreground">
                {{
                  isJsonBody
                    ? t("requestDetail.autoFormatted")
                    : req.body
                      ? t("requestDetail.rawBody")
                      : t("requestDetail.noBody")
                }}
              </span>
            </div>
            <Button
              v-if="req.body"
              size="sm"
              variant="ghost"
              class="h-7 gap-1.5 text-xs"
              @click="copy(prettyBody ?? req.body, t('requestDetail.bodyCopied'))"
            >
              <Copy class="size-3.5" /> {{ t("requestDetail.copy") }}
            </Button>
          </div>

          <div
            v-if="req.body"
            class="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/70 p-4 scrollbar-thin"
          >
            <WebhooksJsonHighlight
              v-if="isJsonBody"
              :source="prettyBody!"
              :show-line-numbers="true"
            />
            <pre
              v-else
              class="whitespace-pre-wrap break-all font-mono text-xs leading-relaxed text-foreground"
            ><code>{{ req.body }}</code></pre>
          </div>
          <div
            v-else
            class="flex flex-1 items-center justify-center text-xs text-muted-foreground"
          >
            {{ t("requestDetail.noBodyText") }}
          </div>
        </TabsContent>

        <TabsContent
          value="headers"
          class="min-h-0 flex-1 overflow-auto px-4 pb-5 pt-3 scrollbar-thin"
        >
          <div class="overflow-hidden rounded-xl border border-border/60">
            <table class="w-full text-xs">
              <thead class="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">
                    {{ t("requestDetail.columnName") }}
                  </th>
                  <th class="px-3 py-2 text-left font-medium">
                    {{ t("requestDetail.columnValue") }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/40">
                <tr v-for="[k, v] in headerEntries" :key="k" class="hover:bg-muted/20">
                  <td class="w-[36%] px-3 py-2 align-top font-mono text-[color:var(--acc-2)]">
                    {{ k }}
                  </td>
                  <td class="px-3 py-2 break-all font-mono text-foreground">{{ v }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent
          value="query"
          class="min-h-0 flex-1 overflow-auto px-4 pb-5 pt-3 scrollbar-thin"
        >
          <div
            v-if="!queryEntries.length"
            class="py-8 text-center text-xs text-muted-foreground"
          >
            {{ t("requestDetail.noQuery") }}
          </div>
          <div v-else class="overflow-hidden rounded-xl border border-border/60">
            <table class="w-full text-xs">
              <thead class="bg-muted/30 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th class="px-3 py-2 text-left font-medium">
                    {{ t("requestDetail.columnParam") }}
                  </th>
                  <th class="px-3 py-2 text-left font-medium">
                    {{ t("requestDetail.columnValue") }}
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-border/40">
                <tr v-for="[k, v] in queryEntries" :key="k" class="hover:bg-muted/20">
                  <td class="w-[36%] px-3 py-2 align-top font-mono text-[color:var(--acc-2)]">
                    {{ k }}
                  </td>
                  <td class="px-3 py-2 break-all font-mono text-foreground">
                    {{ Array.isArray(v) ? v.join(", ") : v }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent
          value="raw"
          class="flex min-h-0 flex-1 flex-col px-4 pb-5 pt-3"
        >
          <div class="flex justify-between pb-2">
            <span class="text-[11px] text-muted-foreground">
              {{ t("requestDetail.httpRebuild") }}
            </span>
            <Button
              size="sm"
              variant="ghost"
              class="h-7 gap-1.5 text-xs"
              @click="copy(rawDump, t('requestDetail.rawCopied'))"
            >
              <Copy class="size-3.5" /> {{ t("requestDetail.copy") }}
            </Button>
          </div>
          <pre
            class="flex-1 overflow-auto rounded-xl border border-border/60 bg-background/70 p-4 font-mono text-xs leading-relaxed text-foreground scrollbar-thin"
          ><code>{{ rawDump }}</code></pre>
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
