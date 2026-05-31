<script setup lang="ts">
import type { AlertDialogContentEmits, AlertDialogContentProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import {
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogPortal,
  useForwardPropsEmits,
} from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<
  AlertDialogContentProps & { class?: HTMLAttributes["class"] }
>();
const emits = defineEmits<AlertDialogContentEmits>();
const { class: _class, ...rest } = props as AlertDialogContentProps & {
  class?: HTMLAttributes["class"];
};
const forwarded = useForwardPropsEmits(rest, emits);
</script>

<template>
  <AlertDialogPortal>
    <AlertDialogOverlay
      class="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
    />
    <AlertDialogContent
      data-slot="alert-dialog-content"
      v-bind="forwarded"
      :class="
        cn(
          'panel data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 p-6 duration-200 sm:max-w-lg',
          props.class
        )
      "
    >
      <slot />
    </AlertDialogContent>
  </AlertDialogPortal>
</template>
