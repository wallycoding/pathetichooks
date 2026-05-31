import { DEFAULT_LOCALE, localeMeta, messages, type LocaleCode } from "@/locales";

type Path = string;

function resolvePath(obj: any, path: Path): unknown {
  const parts = path.split(".");
  let cur: any = obj;
  for (const p of parts) {
    if (cur && typeof cur === "object" && p in cur) {
      cur = cur[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

function interpolate(input: string, params?: Record<string, unknown>): string {
  if (!params) return input;
  return input.replace(/\{(\w+)\}/g, (_, key) => {
    return params[key] !== undefined ? String(params[key]) : `{${key}}`;
  });
}

export function useI18n() {
  const locale = useState<LocaleCode>("ph-locale", () => DEFAULT_LOCALE);

  function setLocale(next: LocaleCode) {
    if (next in messages) {
      locale.value = next;
    }
  }

  function t(key: Path, params?: Record<string, unknown>): string {
    const value = resolvePath(messages[locale.value], key);
    if (typeof value !== "string") {
      const fallback = resolvePath(messages[DEFAULT_LOCALE], key);
      if (typeof fallback === "string") return interpolate(fallback, params);
      return key;
    }
    return interpolate(value, params);
  }

  const availableLocales = computed(() =>
    (Object.keys(messages) as LocaleCode[]).map((code) => ({
      code,
      ...localeMeta[code],
      active: code === locale.value,
    }))
  );

  const currentLocale = computed(() => ({
    code: locale.value,
    ...localeMeta[locale.value],
  }));

  return { locale, setLocale, t, availableLocales, currentLocale };
}
