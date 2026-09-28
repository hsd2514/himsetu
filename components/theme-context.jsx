"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", icon: Sun, label: "Light" },
  { id: "dark", icon: Moon, label: "Dark" },
  { id: "system", icon: Monitor, label: "System" },
];

/**
 * Runs before first paint (inlined in <head>) so the saved theme applies
 * without a flash of the default palette.
 */
export const THEME_BOOT = `(function(){try{var d=document.documentElement;var t="ice";var m=localStorage.getItem("himsetu.mode")||"dark";if(m==="system")m=matchMedia("(prefers-color-scheme: light)").matches?"light":"dark";d.dataset.theme=t;d.dataset.mode=m;}catch(e){document.documentElement.dataset.theme="ice";document.documentElement.dataset.mode="dark";}})();`;

// One palette (Ice). Only light / dark is user-selectable.
const THEME = "ice";

const ThemeCtx = createContext({ theme: THEME, mode: "dark", resolved: "dark", setMode() {} });

export function ThemeProvider({ children }) {
  const theme = THEME;
  const [mode, setModeState] = useState("dark");
  const [systemLight, setSystemLight] = useState(false);

  useEffect(() => {
    try {
      localStorage.removeItem("himsetu.theme"); // left over from the palette picker
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

/** Light / dark / system switch, for the sidebar. */
export function ThemePicker() {
  const { mode, setMode } = useTheme();
  const t = useT();
  return (
    <div className="grid gap-2.5">
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
