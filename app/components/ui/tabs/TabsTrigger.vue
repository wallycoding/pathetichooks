<script setup lang="ts">
import type { TabsTriggerProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { TabsTrigger } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
  <TabsTrigger
    data-slot="tabs-trigger"
    v-bind="props"
    :class="
      cn(
        'tab-modern inline-flex h-full cursor-pointer items-center justify-center gap-1.5 px-3 text-[12.5px] font-medium whitespace-nowrap focus-visible:ring-2 focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4',
        props.class
      )
    "
  >
    <slot />
  </TabsTrigger>
</template>
