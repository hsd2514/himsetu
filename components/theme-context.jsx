"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

export const THEMES = [
  { id: "ice", name: "Ice", swatch: "#2aa8e0" },
  { id: "graphite", name: "Graphite", swatch: "#f97316" },
  { id: "polar", name: "Polar", swatch: "#3b82f6" },
  { id: "aurora", name: "Aurora", swatch: "#10b981" },
  { id: "saffron", name: "Saffron", swatch: "#f59e0b" },
];
const MODES = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Monitor, label: "System" },
];

/**
 * Runs before first paint (inlined in <head>) so the saved theme applies
 * without a flash of the default palette.
 */
export const THEME_BOOT = `(function(){try{var d=document.documentElement;var t=localStorage.getItem("himsetu.theme")||"ice";var m=localStorage.getItem("himsetu.mode")||"dark";if(m==="system")m=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.dataset.theme=t;d.dataset.mode=m;}catch(e){document.documentElement.dataset.theme="ice";document.documentElement.dataset.mode="dark";}})();`;

const ThemeCtx = createContext({ theme: "ice", mode: "dark", resolved: "dark", setTheme() {}, setMode() {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("ice");
  const [mode, setModeState] = useState("dark");
  const [systemLight, setSystemLight] = useState(false);

  useEffect(() => {
    try {
      setThemeState(localStorage.getItem("himsetu.theme") || "ice");
      setModeState(localStorage.getItem("himsetu.mode") || "dark");
    } catch {}
    const mq = matchMedia("(prefers-color-scheme: light)");
    setSystemLight(mq.matches);
    const onChange = (e) => setSystemLight(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = mode === "system" ? (systemLight ? "light" : "dark") : mode;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = resolved;
  }, [theme, resolved]);

  const value = useMemo(
    () => ({
      theme,
      mode,
      resolved,
      setTheme: (t) => {
        setThemeState(t);
        try {
          localStorage.setItem("himsetu.theme", t);
        } catch {}
      },
      setMode: (m) => {
        setModeState(m);
        try {
          localStorage.setItem("himsetu.mode", m);
        } catch {}
      },
    }),
    [theme, mode, resolved]
  );
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export const useTheme = () => useContext(ThemeCtx);

/**
 * Resolved colour values for canvas/SVG code (Leaflet, Recharts) that cannot read
 * CSS variables. Re-reads whenever the palette or mode changes.
 */
export function useThemeColors() {
  const { theme, resolved } = useTheme();
  const [colors, setColors] = useState(null);
  useEffect(() => {
    // Child effects run before the provider writes data-theme, so read on the next frame.
    const id = requestAnimationFrame(() => {
      const s = getComputedStyle(document.documentElement);
      const v = (name) => s.getPropertyValue(name).trim();
      setColors({
        bg: v("--bg"),
        surface: v("--panel"),
        raised: v("--raised"),
        line: v("--border"),
        accent: v("--accent"),
        accentSoft: v("--accent-hover"),
        accentStrong: v("--accent-text"),
        chart1: v("--chart-1"),
        chart2: v("--chart-2"),
        marker: v("--map-marker"),
        text: v("--color-slate-100"),
        muted: v("--color-slate-400"),
        light: resolved === "light",
      });
    });
    return () => cancelAnimationFrame(id);
  }, [theme, resolved]);
  return colors;
}

/** Palette swatches + light/dark/system switch, for the sidebar. */
export function ThemePicker() {
  const { theme, mode, setTheme, setMode } = useTheme();
  const t = useT();
  return (
    <div className="grid gap-2.5">
      <div className="flex items-center justify-between">
        <div role="radiogroup" aria-label={t("Colour theme")} className="flex gap-1.5">
          {THEMES.map((t) => (
            <button
              key={t.id}
              role="radio"
              aria-checked={theme === t.id}
              aria-label={t.name}
              title={t.name}
              onClick={() => setTheme(t.id)}
              className={cn(
                "h-5 w-5 rounded-full ring-offset-2 ring-offset-navy-950 transition-transform active:scale-90",
                theme === t.id ? "ring-2 ring-slate-300" : "opacity-80 hover:opacity-100"
              )}
              style={{ background: t.swatch }}
            />
          ))}
        </div>
      </div>
      <div role="radiogroup" aria-label={t("Light or dark")} className="grid grid-cols-3 rounded-lg border border-white/10 p-0.5">
        {MODES.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            role="radio"
            aria-checked={mode === id}
            title={t(label)}
            onClick={() => setMode(id)}
            className={cn(
              "flex items-center justify-center gap-1 rounded-md py-1 text-[11px] transition-colors",
              mode === id ? "bg-white/10 text-slate-50" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Icon size={12} /> {t(label)}
          </button>
        ))}
      </div>
    </div>
  );
}
