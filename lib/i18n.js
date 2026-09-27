import { HI } from "@/lib/i18n-hi";

/**
 * Lightweight EN / हिं dictionary. The English text is the key, so a missing Hindi
 * entry falls back to readable English instead of a raw key. `{name}` placeholders
 * are filled from `vars`.
 */
export const LANGS = [
  { code: "en", label: "EN", name: "English" },
  { code: "hi", label: "हिं", name: "हिन्दी" },
];

const warned = new Set();

export function translate(lang, text, vars) {
  let s = text;
  if (lang === "hi") {
    s = HI[text] ?? text;
    if (!(text in HI) && process.env.NODE_ENV !== "production" && !warned.has(text)) {
      warned.add(text);
      console.warn(`[i18n] no Hindi for: ${text}`);
    }
  }
  return vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m)) : s;
}
