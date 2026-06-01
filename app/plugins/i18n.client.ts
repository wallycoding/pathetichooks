import type { LocaleCode } from "@/locales";
import { messages } from "@/locales";

const STORAGE_KEY = "ph_locale";

// Map a browser language tag (e.g. "pt-BR", "en-US", "zh") to a supported
// locale: try an exact match first, then fall back to the primary subtag so
// "en-US" → "en" and "zh-Hans" → "zh-CN".
function detectLocale(): LocaleCode | undefined {
  const codes = Object.keys(messages) as LocaleCode[];
  const preferred = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const raw of preferred) {
    if (!raw) continue;
    if (raw in messages) return raw as LocaleCode;
    const primary = raw.split("-")[0]?.toLowerCase();
    const match = codes.find((code) => code.toLowerCase().split("-")[0] === primary);
    if (match) return match;
  }
  return undefined;
}

export default defineNuxtPlugin(() => {
  const { locale } = useI18n();

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && stored in messages) {
      locale.value = stored as LocaleCode;
    } else {
      const detected = detectLocale();
      if (detected) locale.value = detected;
    }
  } catch {}

  watch(locale, (v) => {
    try {
      localStorage.setItem(STORAGE_KEY, v);
    } catch {}
  });
});
