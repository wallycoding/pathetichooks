import ptBR, { type Messages } from "./pt-BR";
import en from "./en";
import ru from "./ru";
import zhCN from "./zh-CN";

export const messages = {
  "pt-BR": ptBR,
  en,
  ru,
  "zh-CN": zhCN,
};

export type LocaleCode = keyof typeof messages;
export type { Messages };

export const localeMeta: Record<LocaleCode, { name: string; nativeName: string; flag: string }> =
  {
    "pt-BR": { name: "Portuguese (BR)", nativeName: "Português", flag: "🇧🇷" },
    en: { name: "English", nativeName: "English", flag: "🇺🇸" },
    ru: { name: "Russian", nativeName: "Русский", flag: "🇷🇺" },
    "zh-CN": { name: "Chinese (Simplified)", nativeName: "中文", flag: "🇨🇳" },
  };

export const DEFAULT_LOCALE: LocaleCode = "pt-BR";
