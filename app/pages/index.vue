<template>
  <NuxtLayout name="webhooks">
    <div
      class="mx-auto flex w-full max-w-[1600px] flex-col gap-3 md:gap-4 lg:grid lg:h-full lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)]"
    >
      <!-- Mobile / tablet: top bar with sidebar trigger -->
      <div
        class="panel flex items-center justify-between gap-2 px-3 py-2 lg:hidden"
      >
        <div class="flex min-w-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            class="h-8 gap-1.5"
            @click="mobileOpen = true"
          >
            <Menu class="size-4" />
            {{ t("home.mobileWebhooks") }}
            <span
              class="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums"
              >{{ store.used }}/{{ store.limit }}</span
            >
          </Button>
          <span
            v-if="store.selectedDetail"
            class="truncate text-sm font-medium text-muted-foreground"
          >
            · {{ store.selectedDetail.name }}
          </span>
        </div>
        <Button
          size="sm"
          class="h-8 gap-1.5"
          :disabled="store.atLimit"
          @click="quickCreate"
        >
          <Plus class="size-4" /> {{ t("home.mobileNew") }}
        </Button>
      </div>

      <!-- Sidebar (desktop) -->
      <div class="hidden min-h-0 lg:block">
        <WebhooksSidebar />
      </div>

      <!-- Sidebar drawer (mobile) -->
      <Dialog v-model:open="mobileOpen">
        <DialogContent
          class="h-[85dvh] max-w-md gap-0 p-0 sm:max-w-md lg:hidden [&>button]:top-3 [&>button]:right-3"
        >
          <div class="flex h-full min-h-0 flex-col p-4">
            <WebhooksSidebar />
          </div>
        </DialogContent>
      </Dialog>

      <!-- Main column -->
      <div class="flex flex-col gap-3 md:gap-4 lg:min-h-0 lg:flex-1">
        <div
          v-if="!store.selectedDetail && !store.loading"
          class="grid min-h-[60dvh] place-items-center lg:min-h-0 lg:flex-1"
        >
          <div class="max-w-lg px-4 text-center">
            <div
              class="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--acc)]/30 bg-[color:var(--acc)]/10 text-[color:var(--acc-strong)] backdrop-blur"
            >
              <Zap class="size-6" />
            </div>
            <h1 class="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {{ t("home.heroTitle") }}
            </h1>
            <p class="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              {{ t("home.heroDescription", { limit: store.limit }) }}
            </p>
            <Button class="mt-7 gap-2" size="lg" @click="openCreate = true">
              <Plus class="size-4" />
              {{ t("home.createFirst") }}
            </Button>
          </div>
        </div>

        <template v-else>
          <WebhooksWebhookHeader
            :on-open-config="() => (openConfig = true)"
            :on-open-delete="() => (openDelete = true)"
          />
          <div
            class="grid grid-cols-1 gap-3 md:gap-4 lg:min-h-0 lg:flex-1 xl:grid-cols-[360px_minmax(0,1fr)]"
          >
            <div class="min-h-[280px] xl:min-h-0">
              <WebhooksRequestList />
            </div>
            <div class="min-h-[360px] xl:min-h-0">
              <WebhooksRequestDetail />
            </div>
          </div>
        </template>
      </div>
    </div>

    <WebhooksCreateDialog v-model:open="openCreate" />
    <WebhooksConfigDialog v-model:open="openConfig" />
    <WebhooksDeleteDialog v-model:open="openDelete" />
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { Plus, Zap, Menu } from "lucide-vue-next";
import { toast } from "vue-sonner";

const { t } = useI18n();
const { toMessage } = useApiError();

useHead({
  title: () => t("app.pageTitle"),
});

const store = useWebhooksStore();
const openCreate = ref(false);
const openConfig = ref(false);
const openDelete = ref(false);
const mobileOpen = ref(false);

async function quickCreate() {
  if (store.atLimit) {
    toast.error(t("home.limitReachedToast", { limit: store.limit }));
    return;
  }
  try {
    await store.createWebhook();
    toast.success(t("home.createdToast"));
  } catch (e) {
    toast.error(toMessage(e, "home.errorToast"));
  }
}

watch(
  () => store.selectedToken,
  () => {
    mobileOpen.value = false;
  }
);

onMounted(async () => {
  try {
    await store.loadSession();
  } catch (e) {
    toast.error(toMessage(e, "errors.network"));
  }
});

onBeforeUnmount(() => {
  store.closeStream();
});
</script>
