<template>
  <div class="flex min-h-[100dvh] flex-col lg:h-[100dvh] lg:overflow-hidden">
    <WebhooksHeader />
    <main class="min-h-0 flex-1 px-3 pb-3 pt-3 sm:px-4 lg:px-6 lg:pb-4 lg:pt-4">
      <slot />
    </main>
  </div>
</template>

<script lang="ts" setup></script>
