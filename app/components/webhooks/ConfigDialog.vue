<script setup lang="ts">
import { toast } from "vue-sonner";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [v: boolean] }>();

const store = useWebhooksStore();
const { t } = useI18n();
const { toMessage } = useApiError();

const name = ref("");
const description = ref("");
const status = ref(200);
const contentType = ref("application/json");
const body = ref('{"ok":true}');
const saving = ref(false);

watch(
  () => [props.open, store.selectedDetail?.token] as const,
  ([isOpen]) => {
    if (isOpen && store.selectedDetail) {
      name.value = store.selectedDetail.name;
      description.value = store.selectedDetail.description;
      status.value = store.selectedDetail.responseConfig.status;
      contentType.value = store.selectedDetail.responseConfig.contentType;
      body.value = store.selectedDetail.responseConfig.body;
    }
  },
  { immediate: true }
);

async function save() {
  if (!store.selectedToken) return;
  saving.value = true;
  try {
    await store.updateWebhook(store.selectedToken, {
      name: name.value,
      description: description.value,
      responseConfig: {
        status: Number(status.value),
        contentType: contentType.value,
        body: body.value,
      },
    });
    toast.success(t("configDialog.saved"));
    emit("update:open", false);
  } catch (e) {
    toast.error(toMessage(e, "configDialog.saveError"));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent class="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{{ t("configDialog.title") }}</DialogTitle>
        <DialogDescription>{{ t("configDialog.description") }}</DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <Label for="cfg-name">{{ t("configDialog.nameLabel") }}</Label>
          <Input
            id="cfg-name"
            v-model="name"
            :placeholder="t('configDialog.namePlaceholder')"
          />
        </div>

        <div class="grid gap-2">
          <Label for="cfg-desc">{{ t("configDialog.descriptionLabel") }}</Label>
          <Textarea
            id="cfg-desc"
            v-model="description"
            :placeholder="t('configDialog.descriptionPlaceholder')"
            class="min-h-[60px]"
          />
        </div>

        <Separator class="my-1" />

        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <Label for="cfg-status">{{ t("configDialog.statusLabel") }}</Label>
            <Input id="cfg-status" type="number" min="100" max="599" v-model="status" />
          </div>
          <div class="grid gap-2">
            <Label for="cfg-ct">{{ t("configDialog.contentTypeLabel") }}</Label>
            <Input id="cfg-ct" v-model="contentType" placeholder="application/json" />
          </div>
        </div>

        <div class="grid gap-2">
          <Label for="cfg-body">{{ t("configDialog.bodyLabel") }}</Label>
          <Textarea
            id="cfg-body"
            v-model="body"
            class="min-h-[140px] font-mono text-xs"
            placeholder='{"ok":true}'
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t("configDialog.cancel") }}
        </Button>
        <Button :disabled="saving" @click="save">{{ t("configDialog.save") }}</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
