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
  setLang: (_lang: string) => {},
  t: (key: string) => key,
});

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState(defaultLang);
  const setLang = (v: string) => {
    setLangState(v);
    if (typeof window !== "undefined") localStorage.setItem("lang", v);
  };
  const t = useCallback((key: string) => {
    return languages[lang][key] || key;
  }, [lang]);
  // on mount sync state from localStorage if changed elsewhere
  typeof window !== "undefined" && useState(() => {
    const l = localStorage.getItem("lang");
    if (l && l !== lang) setLangState(l);
  });
  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
