<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { useVModel } from "@vueuse/core";
import { cn } from "@/lib/utils";

const props = defineProps<{
  class?: HTMLAttributes["class"];
  defaultValue?: string | number;
  modelValue?: string | number;
}>();
const emits = defineEmits<{
  "update:modelValue": [payload: string | number];
}>();
const modelValue = useVModel(props, "modelValue", emits, {
  passive: true,
  defaultValue: props.defaultValue,
});
</script>

<template>
  <textarea
    v-model="modelValue"
    data-slot="textarea"
    :class="
      cn(
        'border-border placeholder:text-muted-foreground/70 focus-visible:border-[color:var(--acc)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--acc)]/25 aria-invalid:border-destructive bg-input/70 flex field-sizing-content min-h-16 w-full rounded-lg border px-3 py-2 text-[13px] tracking-tight transition-all outline-none disabled:cursor-not-allowed disabled:opacity-50 caret-[color:var(--acc)]',
        props.class
      )
    "
  />
</template>
