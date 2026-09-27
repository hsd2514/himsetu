"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Boxes, MessageSquareLock, Siren, Snowflake, Info, ChevronsUpDown } from "lucide-react";
import { NODES, useStation } from "@/components/station-context";
import { LanguageToggle, useT } from "@/components/language-context";
import { useNow } from "@/components/use-me";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Mission", icon: LayoutDashboard },
  { href: "/cargo", label: "Cargo", icon: Package },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/messages", label: "Messages", icon: MessageSquareLock },
  { href: "/field", label: "Field", icon: Siren },
  { href: "/ice", label: "Sea ice", icon: Snowflake },
  { href: "/about", label: "About", icon: Info },
];

function LocalClock({ tz }) {
  const now = useNow(1000);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  // Server and browser disagree on the current second, so render the time only after mount.
  if (!mounted) return <span className="block h-4" />;
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now);
  return (
    <span className="tnum block h-4 font-mono text-[11px] text-slate-400">
      {time} {tz === "UTC" ? "UTC" : "IST"}
    </span>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { node, setNodeCode } = useStation();
  const t = useT();
  const active = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <aside className="flex w-full flex-col gap-5 border-b border-white/[0.06] bg-navy-950/70 p-4 backdrop-blur md:sticky md:top-0 md:h-[100dvh] md:w-64 md:border-b-0 md:border-r md:p-5">
      <div className="flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-ice-400 to-ice-500 text-navy-950 shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]">
            <Snowflake size={18} strokeWidth={2.25} />
          </span>
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-[0.12em] text-slate-50">HIMSETU</span>
            <span className="block text-[11px] text-slate-400">हिमसेतु</span>
          </span>
        </Link>
        <LanguageToggle />
      </div>

      <label className="surface relative block rounded-xl px-3 py-2.5">
        <span className="block text-[11px] text-slate-400">{t("Logged in as")}</span>
        <select
          value={node.code}
          onChange={(e) => setNodeCode(e.target.value)}
          className="w-full cursor-pointer appearance-none bg-transparent pr-6 text-sm font-medium text-slate-100 focus:outline-none [&>option]:bg-navy-900"
        >
          {NODES.map((n) => (
            <option key={n.code} value={n.code}>
              {t(n.label)}
            </option>
          ))}
        </select>
        <ChevronsUpDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <LocalClock tz={node.tz} />
      </label>

      <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 md:mx-0 md:flex-col md:overflow-visible md:px-0 md:pb-0">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={active(href) ? "page" : undefined}
            className={cn(
              "relative flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-slate-100",
              active(href) && "bg-white/[0.06] text-slate-50"
            )}
          >
            {active(href) && <span className="absolute inset-y-2 left-0 hidden w-0.5 rounded-full bg-ice-400 md:block" />}
            <Icon size={16} strokeWidth={1.75} className={active(href) ? "text-ice-300" : ""} />
            {t(label)}
          </Link>
        ))}
      </nav>

      <div className="mt-auto hidden border-t border-white/[0.06] pt-4 text-[11px] leading-relaxed text-slate-500 md:block">
        {t("Data hosted in India · ISRO EOS-04 imagery")}
        <br />
        <span className="text-slate-400">{t("Plan it in Goa. Trust it on the ice.")}</span>
      </div>
    </aside>
  );
}
