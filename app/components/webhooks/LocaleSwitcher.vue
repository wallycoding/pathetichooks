<script setup lang="ts">
import { Languages, Check } from "lucide-vue-next";
import type { LocaleCode } from "@/locales";

const { availableLocales, setLocale, t } = useI18n();

function pick(code: LocaleCode) {
  setLocale(code);
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button
        variant="ghost"
        size="icon-sm"
        class="gap-1.5"
        :aria-label="t('header.language')"
        :title="t('header.language')"
      >
        <Languages class="size-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="min-w-[180px]">
      <DropdownMenuLabel class="text-[10px] uppercase tracking-wider text-muted-foreground">
        {{ t("header.language") }}
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        v-for="l in availableLocales"
        :key="l.code"
        @click="pick(l.code)"
        class="cursor-pointer justify-between gap-3"
      >
        <span class="flex items-center gap-2">
          <span class="text-base leading-none">{{ l.flag }}</span>
          <span>{{ l.nativeName }}</span>
        </span>
        <Check v-if="l.active" class="size-4 text-emerald-400" />
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
