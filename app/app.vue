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
const { locale } = useI18n();

useHead({
  htmlAttrs: { class: "dark", lang: () => locale.value },
});
</script>
