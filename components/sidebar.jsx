"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Boxes, MessageSquareLock, Siren, Snowflake, Info } from "lucide-react";
import { NODES, useStation } from "@/components/station-context";
import { LanguageToggle, useT } from "@/components/language-context";
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

export function Sidebar() {
  const pathname = usePathname();
  const { node, setNodeCode } = useStation();
  const t = useT();
  return (
    <aside className="flex w-full flex-col gap-4 border-b border-navy-800 bg-navy-900 p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xl font-bold tracking-wider text-ice-300">HIMSETU</div>
          <div className="text-xs text-slate-400">हिमसेतु · {t("bridge to the ice")}</div>
        </div>
        <LanguageToggle />
      </div>
      <label className="text-xs text-slate-400">
        {t("Logged in as")}
        <select
          value={node.code}
          onChange={(e) => setNodeCode(e.target.value)}
          className="mt-1 w-full rounded-lg border border-navy-700 bg-navy-800 px-2 py-2 text-sm text-slate-100"
        >
          {NODES.map((n) => (
            <option key={n.code} value={n.code}>
              {t(n.label)}
            </option>
          ))}
        </select>
      </label>
      <nav className="flex flex-wrap gap-1 md:flex-col">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-navy-800",
              pathname === href && "bg-navy-800 text-ice-300"
            )}
          >
            <Icon size={16} /> {t(label)}
          </Link>
        ))}
      </nav>
      <div className="mt-auto hidden text-[11px] leading-relaxed text-slate-500 md:block">
        {t("Data hosted in India · ISRO EOS-04 imagery")}
        <br />
        {t("Plan it in Goa. Trust it on the ice.")}
      </div>
    </aside>
  );
}
