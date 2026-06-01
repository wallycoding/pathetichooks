<script setup lang="ts">
import { Webhook, Github } from "lucide-vue-next";

const store = useWebhooksStore();
const { t } = useI18n();

const pct = computed(() =>
  store.limit > 0 ? Math.round((store.used / store.limit) * 100) : 0
);
</script>

<template>
  <header
    class="sticky top-0 z-30 border-b border-border/60 bg-background/70 backdrop-blur"
  >
    <div
      class="container mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 md:px-6"
    >
      <NuxtLink
        to="/"
        class="group flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 rounded-md"
      >
        <div
          class="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[color:var(--acc)]/40 bg-[color:color-mix(in_oklab,var(--acc)_12%,var(--card))] text-[color:var(--acc-strong)] transition-colors group-hover:border-[color:var(--acc)]/60"
        >
          <Webhook class="size-4" />
          <span
            class="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-inset ring-white/5"
          />
        </div>
        <div class="flex items-baseline gap-2">
          <span class="text-[15px] font-semibold tracking-tight text-foreground">
            Pathetic<span class="text-[color:var(--acc-strong)]">Hooks</span>
          </span>
          <span class="hidden text-[12px] text-muted-foreground sm:inline">
            · {{ t("app.tagline") }}
          </span>
        </div>
      </NuxtLink>

      <div class="flex items-center gap-2 sm:gap-3">
        <div
          class="hidden items-center gap-2.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-[12px] sm:flex"
        >
          <span class="live-dot" />
          <span class="text-muted-foreground">{{ t("header.session") }}</span>
          <span class="font-mono text-foreground tabular-nums"
            >{{ store.used }}<span class="text-muted-foreground/70">/{{ store.limit }}</span></span
          >
          <div
            class="h-1 w-14 overflow-hidden rounded-full border border-border/60 bg-background/50"
          >
            <div
              class="h-full rounded-full bg-[color:var(--acc)] transition-all"
              :style="{ width: pct + '%' }"
            />
          </div>
        </div>
        <WebhooksLocaleSwitcher />
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              size="icon-sm"
              as="a"
              href="https://github.com/wallycoding/pathetichooks"
              target="_blank"
              rel="noopener"
            >
              <Github class="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ t("header.github") }}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  </header>
</template>
