<script setup lang="ts">
import { toast } from "vue-sonner";

const props = defineProps<{ open: boolean }>();
const emit = defineEmits<{ "update:open": [v: boolean] }>();

const store = useWebhooksStore();
const { t } = useI18n();
const { toMessage } = useApiError();
const deleting = ref(false);

async function confirm() {
  if (!store.selectedToken) return;
  deleting.value = true;
  try {
    const token = store.selectedToken;
    await store.deleteWebhook(token);
    toast.success(t("deleteDialog.removed"));
    emit("update:open", false);
  } catch (e) {
    toast.error(toMessage(e, "deleteDialog.error"));
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <AlertDialog :open="open" @update:open="(v) => emit('update:open', v)">
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>{{ t("deleteDialog.title") }}</AlertDialogTitle>
        <AlertDialogDescription>
          {{
            t("deleteDialog.description", {
              name: store.selectedDetail?.name ?? "",
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel @click="emit('update:open', false)">
          {{ t("deleteDialog.cancel") }}
        </AlertDialogCancel>
        <Button variant="destructive" :disabled="deleting" @click="confirm">
          {{ t("deleteDialog.remove") }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>
