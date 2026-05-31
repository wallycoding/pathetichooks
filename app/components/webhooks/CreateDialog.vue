<script setup lang="ts">
import { toast } from "vue-sonner";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [v: boolean] }>();

const store = useWebhooksStore();
const { t } = useI18n();
const { toMessage } = useApiError();

const name = ref("");
const description = ref("");
const saving = ref(false);

watch(
  () => props.open,
  (v) => {
    if (v) {
      name.value = "";
      description.value = "";
    }
  }
);

async function submit() {
  if (store.atLimit) {
    toast.error(t("createDialog.limitReached", { limit: store.limit }));
    return;
  }
  saving.value = true;
  try {
    await store.createWebhook({
      name: name.value,
      description: description.value,
    });
    toast.success(t("createDialog.created"));
    emit("update:open", false);
  } catch (e) {
    toast.error(toMessage(e, "createDialog.error"));
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(v) => emit('update:open', v)">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ t("createDialog.title") }}</DialogTitle>
        <DialogDescription>
          {{ t("createDialog.description", { used: store.used, limit: store.limit }) }}
        </DialogDescription>
      </DialogHeader>

      <div class="grid gap-4 py-2">
        <div class="grid gap-2">
          <Label for="new-name">{{ t("createDialog.nameLabel") }}</Label>
          <Input
            id="new-name"
            v-model="name"
            :placeholder="t('createDialog.namePlaceholder')"
            maxlength="64"
          />
        </div>
        <div class="grid gap-2">
          <Label for="new-desc">{{ t("createDialog.descriptionLabel") }}</Label>
          <Textarea
            id="new-desc"
            v-model="description"
            :placeholder="t('createDialog.descriptionPlaceholder')"
            maxlength="200"
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="emit('update:open', false)">
          {{ t("createDialog.cancel") }}
        </Button>
        <Button :disabled="saving || store.atLimit" @click="submit">
          {{ t("createDialog.create") }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
