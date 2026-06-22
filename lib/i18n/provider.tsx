"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { dictionaries, type Lang, type TranslationKey } from "./dictionaries";

const LANG_KEY = "splitbro:lang";

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("id");

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_KEY) as Lang | null;
    if (saved === "id" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") window.localStorage.setItem(LANG_KEY, l);
  }, []);

  const t = useCallback((key: TranslationKey) => dictionaries[lang][key], [lang]);

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useT() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within I18nProvider");
  return ctx;
}
