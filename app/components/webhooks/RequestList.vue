<script setup lang="ts">
import { Trash2, X, Filter, Radio } from "lucide-vue-next";
import { toast } from "vue-sonner";

const store = useWebhooksStore();
const { relativeTime, methodClass, formatBytes } = useFormat();
const { t } = useI18n();
const { toMessage } = useApiError();

const filter = ref("");

const filteredRequests = computed(() => {
  if (!store.selectedDetail) return [];
  const s = filter.value.trim().toLowerCase();
  if (!s) return store.selectedDetail.requests;
  return store.selectedDetail.requests.filter(
    (r) =>
      r.method.toLowerCase().includes(s) ||
      r.path.toLowerCase().includes(s) ||
      r.contentType.toLowerCase().includes(s)
  );
});

async function clearAll() {
  if (!store.selectedToken) return;
  try {
    await store.clearRequests(store.selectedToken);
    toast.success(t("requestList.historyCleared"));
  } catch (e) {
    toast.error(toMessage(e, "requestList.error"));
  }
}

async function removeOne(id: string) {
  if (!store.selectedToken) return;
  try {
    await store.deleteRequest(store.selectedToken, id);
  } catch (e) {
    toast.error(toMessage(e, "requestList.error"));
  }
}
</script>

<template>
  <div class="panel flex h-full min-h-0 flex-col overflow-hidden">
    <div class="panel-header">
      <Radio class="icon" />
      <span class="label">{{ t("requestList.title") }}</span>
      <span
        class="rounded-md border border-border/70 bg-background/30 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground"
      >
        {{ store.selectedDetail?.requests.length ?? 0 }}
      </span>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="icon-sm"
            variant="ghost"
            class="ml-auto h-6 w-6 text-muted-foreground hover:text-destructive"
            :disabled="!store.selectedDetail?.requests.length"
            @click="clearAll"
          >
            <Trash2 class="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{{ t("requestList.clearHistory") }}</TooltipContent>
      </Tooltip>
    </div>

    <div class="border-b border-border/60 p-2.5">
      <div class="relative">
        <Filter
          class="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="filter"
          class="h-8 pl-7 text-[12px]"
          :placeholder="t('requestList.filterPlaceholder')"
        />
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      <div
        v-if="!store.selectedDetail?.requests.length"
        class="flex h-full flex-col items-center justify-center gap-3 px-6 py-12 text-center"
      >
        <div
          class="relative flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border bg-background/30"
        >
          <span class="live-dot" />
        </div>
        <div class="space-y-1">
          <p class="text-[13px] font-medium text-foreground">{{ t("requestList.waiting") }}</p>
          <p class="max-w-xs text-[12px] leading-relaxed text-muted-foreground">
            {{ t("requestList.waitingDesc") }}
          </p>
        </div>
      </div>

      <ul v-else class="divide-y divide-border/50">
        <li v-for="req in filteredRequests" :key="req.id">
          <div
            class="group relative flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-accent/40"
            :class="{
              'bg-accent/55': store.selectedRequestId === req.id,
            }"
            role="button"
            tabindex="0"
            @click="store.selectRequest(req.id)"
            @keydown.enter="store.selectRequest(req.id)"
            @keydown.space.prevent="store.selectRequest(req.id)"
          >
            <div
              v-if="store.selectedRequestId === req.id"
              class="absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-[color:var(--acc)]"
            />
            <span :class="methodClass(req.method)" class="mt-0.5 shrink-0">
              {{ req.method }}
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <code class="truncate font-mono text-[12px] text-foreground">{{ req.path }}</code>
                <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {{ relativeTime(req.createdAt) }}
                </span>
              </div>
              <div class="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                <span v-if="req.contentType" class="truncate font-mono">
                  {{ req.contentType.split(";")[0] }}
                </span>
                <span v-if="req.size">·</span>
                <span v-if="req.size" class="font-mono">{{ formatBytes(req.size) }}</span>
              </div>
            </div>
            <button
              class="ml-1 hidden h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/20 hover:text-destructive group-hover:flex"
              @click.stop="removeOne(req.id)"
              :aria-label="t('requestList.removeRequest')"
            >
              <X class="size-3.5" />
            </button>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
