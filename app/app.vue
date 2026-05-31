<template>
  <div>
    <Toaster
      theme="dark"
      position="bottom-right"
      :rich-colors="true"
      :close-button="true"
    />
    <NuxtPage />
  </div>
</template>
<script lang="ts" setup>
useHead({
  htmlAttrs: { class: "dark" },
});
</script>
