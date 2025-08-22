"use client";
import { useState, useCallback, createContext, useContext } from "react";
import en from "../languages/en.json";
import pt from "../languages/pt-BR.json";

const languages = {
  en,
  "pt-BR": pt,
};

const defaultLang = typeof window !== "undefined" && localStorage.getItem("lang") || "en";

const I18nContext = createContext({
  lang: defaultLang,
  setLang: (_: string) => {},
  t: (key: string) => key,
});

import { useEffect } from "react";
export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState(defaultLang);
  const setLang = (v: string) => {
    setLangState(v);
    if (typeof window !== "undefined") localStorage.setItem("lang", v);
  };
  useEffect(() => {
    const l = localStorage.getItem("lang");
    if (l && l !== lang) setLangState(l);
  }, [lang]);
  const t = useCallback((key: string) => {
    const langData = languages[lang as keyof typeof languages];
    if (!langData) return key;
    
    const keys = key.split('.');
    let value: unknown = langData;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) return key;
    }
    return value || key;
  }, [lang]);
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
