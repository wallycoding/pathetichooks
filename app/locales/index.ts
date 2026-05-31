import ptBR from "./pt-BR";

export const messages = {
  "pt-BR": ptBR,
};

export const localeMeta: Record<LocaleCode, { name: string; nativeName: string; flag: string }> =
  {
    "pt-BR": { name: "Portuguese (BR)", nativeName: "Português", flag: "🇧🇷" },
  };

export type LocaleCode = keyof typeof messages;
export type Messages = (typeof messages)[LocaleCode];

export const DEFAULT_LOCALE: LocaleCode = "pt-BR";
