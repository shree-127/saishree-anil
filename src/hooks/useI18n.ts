import { useCallback } from "react";
import { en, TranslationKey } from "../i18n/en";
import { kn } from "../i18n/kn";
import { useAppStore } from "../store/useAppStore";

export function useI18n() {
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const toggleLanguage = useAppStore((state) => state.toggleLanguage);

  const t = useCallback(
    (key: TranslationKey): string => {
      if (language === "kn") {
        return kn[key] || en[key] || (key as string);
      }
      return en[key] || kn[key] || (key as string);
    },
    [language]
  );

  return {
    t,
    language,
    setLanguage,
    toggleLanguage,
    isKannada: language === "kn",
  };
}
