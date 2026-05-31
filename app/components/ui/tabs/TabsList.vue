<script setup lang="ts">
import type { TabsListProps } from "reka-ui";
import type { HTMLAttributes } from "vue";
import { TabsList } from "reka-ui";
import { cn } from "@/lib/utils";

const props = defineProps<TabsListProps & { class?: HTMLAttributes["class"] }>();
</script>

<template>
  <TabsList
    data-slot="tabs-list"
    v-bind="props"
    :class="cn('tabs-modern inline-flex h-9 w-fit', props.class)"
  >
    <slot />
  </TabsList>
</template>
