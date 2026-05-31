<script setup lang="ts">
import { Search, Plus, Inbox, Sparkles, X } from "lucide-vue-next";
import { toast } from "vue-sonner";

const store = useWebhooksStore();
const { relativeTime, methodClass } = useFormat();
const { t } = useI18n();
const { toMessage } = useApiError();

const creating = ref(false);
async function handleCreate() {
  if (store.atLimit) {
    toast.error(t("createDialog.limitReached", { limit: store.limit }));
    return;
  }
  creating.value = true;
  try {
    await store.createWebhook();
    toast.success(t("createDialog.created"));
  } catch (e) {
    toast.error(toMessage(e, "createDialog.error"));
  } finally {
    creating.value = false;
  }
}

const pct = computed(() =>
  store.limit > 0 ? Math.round((store.used / store.limit) * 100) : 0
);
</script>

<template>
  <aside class="panel flex h-full min-h-0 flex-col overflow-hidden">
    <div class="panel-header">
      <Inbox class="icon" />
      <span class="label">{{ t("sidebar.title") }}</span>
      <span class="ml-auto font-mono text-[12px] tabular-nums text-muted-foreground">
        {{ store.used }}/{{ store.limit }}
      </span>
    </div>

    <div class="flex flex-col gap-3 p-3">
      <div class="h-1 w-full overflow-hidden rounded-full border border-border/60 bg-background/30">
        <div
          class="h-full rounded-full bg-[color:var(--acc)] transition-all"
          :style="{ width: pct + '%' }"
        />
      </div>

      <Button
        size="sm"
        class="w-full justify-center gap-2"
        :disabled="store.atLimit || creating"
        @click="handleCreate"
      >
        <Plus class="size-4" />
        {{ t("sidebar.newWebhook") }}
      </Button>

      <div class="relative">
        <Search
          class="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          v-model="store.search"
          :placeholder="t('sidebar.searchPlaceholder')"
          class="h-9 pl-8"
        />
        <button
          v-if="store.search"
          class="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          @click="store.search = ''"
          :aria-label="t('sidebar.clearSearch')"
        >
          <X class="size-3.5" />
        </button>
      </div>
    </div>

    <div class="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
      <div
        v-if="store.webhooks.length === 0 && !store.loading"
        class="flex h-full flex-col items-center justify-center gap-3 px-4 py-10 text-center"
      >
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-border bg-background/30"
        >
          <Sparkles class="size-5 text-muted-foreground" />
        </div>
        <p class="max-w-[15rem] text-[13px] leading-relaxed text-muted-foreground">
          {{ t("sidebar.empty") }}
        </p>
      </div>

      <ul class="space-y-1">
        <li v-for="hook in store.filteredWebhooks" :key="hook.token">
          <button
            class="group relative block w-full cursor-pointer overflow-hidden rounded-lg border border-transparent p-2.5 text-left transition-colors hover:border-border/70 hover:bg-accent/40"
            :class="{
              'border-border bg-accent/55':
                store.selectedToken === hook.token,
            }"
            @click="store.selectWebhook(hook.token)"
          >
            <div
              v-if="store.selectedToken === hook.token"
              class="absolute inset-y-1.5 left-0 w-0.5 rounded-r-full bg-[color:var(--acc)]"
            />
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <div class="truncate text-[14px] font-medium text-foreground">
                  {{ hook.name }}
                </div>
                <div class="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                  /{{ hook.token.slice(0, 14) }}…
                </div>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span
                  v-if="hook.lastRequest"
                  :class="methodClass(hook.lastRequest.method)"
                  >{{ hook.lastRequest.method }}</span
                >
                <span
                  class="rounded-md border border-border/70 bg-background/30 px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-muted-foreground"
                >
                  {{ hook.requestCount }}
                </span>
              </div>
            </div>
            <div
              v-if="hook.lastRequest"
              class="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground"
            >
              <span class="live-dot !h-1.5 !w-1.5" />
              {{ t("sidebar.last") }} {{ relativeTime(hook.lastRequest.createdAt) }}
            </div>
            <div v-else class="mt-1.5 text-[11px] text-muted-foreground/70">
              {{ t("sidebar.waitingFirst") }}
            </div>
          </button>
        </li>
      </ul>
    </div>

    <div class="border-t border-border/60 bg-card/30 px-3 py-2.5">
      <p class="text-[11px] leading-relaxed text-muted-foreground">
        {{ t("sidebar.sessionInfo") }}
        <span class="font-medium text-foreground">{{ t("sidebar.sevenDays") }}</span
        >.
      </p>
    </div>
  </aside>
</template>
