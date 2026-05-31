<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { cn } from "@/lib/utils";
import { useVModel } from "@vueuse/core";

const props = defineProps<{
  defaultValue?: string | number;
  modelValue?: string | number;
  class?: HTMLAttributes["class"];
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
  <input
    v-model="modelValue"
    data-slot="input"
    :class="
      cn(
        'file:text-foreground placeholder:text-muted-foreground/70 selection:bg-[color:var(--acc)]/30 selection:text-foreground flex h-9 w-full min-w-0 rounded-lg border border-border bg-input/70 px-3 py-1 text-[13px] tracking-tight transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 caret-[color:var(--acc)]',
        'focus-visible:border-[color:var(--acc)]/60 focus-visible:ring-2 focus-visible:ring-[color:var(--acc)]/25',
        'aria-invalid:border-destructive',
        props.class
      )
    "
  />
</template>
