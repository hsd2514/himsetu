"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { LANGS, translate } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const LangCtx = createContext({ lang: "en", setLang: () => {}, t: (s, v) => translate("en", s, v) });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("himsetu.lang");
      if (LANGS.some((l) => l.code === saved)) setLangState(saved);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => {
    const setLang = (code) => {
      setLangState(code);
      try {
        localStorage.setItem("himsetu.lang", code);
      } catch {}
    };
    return { lang, setLang, t: (s, v) => translate(lang, s, v) };
  }, [lang]);

  return <LangCtx.Provider value={value}>{children}</LangCtx.Provider>;
}

export const useLang = () => useContext(LangCtx);
export const useT = () => useContext(LangCtx).t;

/** EN | हिं segmented switch. */
export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div role="group" aria-label="Language / भाषा" className="flex shrink-0 rounded-lg border border-navy-700 p-0.5 text-xs">
      {LANGS.map((l) => (
        <button
          key={l.code}
          type="button"
          lang={l.code}
          title={l.name}
          aria-pressed={lang === l.code}
          onClick={() => setLang(l.code)}
          className={cn(
            "rounded-md px-2 py-1",
            lang === l.code ? "bg-ice-500 font-medium text-navy-950" : "text-slate-400 hover:text-slate-200"
          )}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
