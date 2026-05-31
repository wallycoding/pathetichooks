import type { LocaleCode } from "@/locales";
import { messages } from "@/locales";

const STORAGE_KEY = "ph_locale";

export default defineNuxtPlugin(() => {
  const { locale } = useI18n();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in messages) {
      locale.value = stored as LocaleCode;
    }
  } catch {}

  watch(locale, (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  });
});
