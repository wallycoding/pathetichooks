<script setup lang="ts">
import { Copy, Settings2, Trash2, ExternalLink, Terminal, Link2 } from "lucide-vue-next";
import { toast } from "vue-sonner";

const store = useWebhooksStore();
const { t } = useI18n();

defineProps<{
  onOpenConfig: () => void;
  onOpenDelete: () => void;
}>();

const url = computed(() =>
  store.selectedToken ? store.publicUrl(store.selectedToken) : ""
);

async function copyUrl() {
  if (!url.value) return;
  try {
    await navigator.clipboard.writeText(url.value);
    toast.success(t("webhookHeader.urlCopied"));
  } catch {
    toast.error(t("webhookHeader.copyFailed"));
  }
}

async function copyCurl() {
  if (!url.value) return;
  const cmd = `curl -X POST '${url.value}' \\\n  -H 'content-type: application/json' \\\n  -d '{"hello":"world"}'`;
  try {
    await navigator.clipboard.writeText(cmd);
    toast.success(t("webhookHeader.curlCopied"));
  } catch {
    toast.error(t("webhookHeader.copyFailed"));
  }
}
</script>

<template>
  <div class="panel overflow-hidden">
    <div class="panel-header">
      <Link2 class="icon" />
      <span class="label">endpoint</span>
    </div>

    <div v-if="!store.selectedDetail" class="px-5 py-4 text-sm text-muted-foreground">
      {{ t("webhookHeader.selectOrCreate") }}
    </div>

    <div v-else class="flex flex-col gap-4 px-5 py-4">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-center gap-2.5">
            <h1 class="truncate text-xl font-semibold tracking-tight text-foreground">
              {{ store.selectedDetail.name }}
            </h1>
            <Badge variant="success" class="gap-1.5">
              <span class="live-dot" /> {{ t("webhookHeader.live") }}
            </Badge>
          </div>
          <p
            v-if="store.selectedDetail.description"
            class="mt-1 line-clamp-2 max-w-2xl text-[13px] text-muted-foreground"
          >
            {{ store.selectedDetail.description }}
          </p>
          <p v-else class="mt-1 text-[12px] italic text-muted-foreground/60">
            {{ t("webhookHeader.noDescription") }}
          </p>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="copyCurl">
            <Terminal class="size-3.5" /> {{ t("webhookHeader.cURL") }}
          </Button>
          <Button size="sm" variant="outline" class="h-8 gap-1.5" @click="onOpenConfig">
            <Settings2 class="size-3.5" /> {{ t("webhookHeader.response") }}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            class="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            @click="onOpenDelete"
            :aria-label="t('webhookHeader.removeWebhook')"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>
      </div>

      <div
        class="group flex items-center gap-2 rounded-xl border border-border/60 bg-card/40 px-3 py-2 font-mono text-[13px] backdrop-blur"
      >
        <span class="select-none text-[color:var(--acc-strong)]">&gt;</span>
        <span
          class="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300"
        >
          ANY
        </span>
        <span class="min-w-0 truncate text-foreground">{{ url }}</span>
        <div class="ml-auto flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button
                size="icon-sm"
                variant="ghost"
                class="h-7 w-7"
                as="a"
                :href="url"
                target="_blank"
                rel="noopener"
              >
                <ExternalLink class="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t("webhookHeader.openNewTab") }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <Button size="icon-sm" variant="ghost" class="h-7 w-7" @click="copyUrl">
                <Copy class="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{{ t("webhookHeader.copyUrl") }}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <div class="flex items-center gap-1.5 text-muted-foreground">
          <span class="font-mono tabular-nums font-medium text-foreground">{{
            store.selectedDetail.requests.length
          }}</span>
          {{ t("webhookHeader.requestsCaptured") }}
        </div>
        <span class="text-muted-foreground/40">·</span>
        <div class="flex items-center gap-1.5 text-muted-foreground">
          {{ t("webhookHeader.responds") }}
          <span class="rounded-md border border-border/70 bg-background/30 px-1.5 py-0.5 font-mono text-foreground">
            {{ store.selectedDetail.responseConfig.status }}
          </span>
        </div>
        <span class="text-muted-foreground/40">·</span>
        <div class="flex items-center gap-1.5 text-muted-foreground">
          {{ t("webhookHeader.contentType") }}
          <span class="rounded-md border border-border/70 bg-background/30 px-1.5 py-0.5 font-mono text-foreground">
            {{ store.selectedDetail.responseConfig.contentType }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
