"use client";
import { ShieldAlert } from "lucide-react";
import { useT } from "@/components/language-context";
import { ROLE_LABEL } from "@/lib/rbac";

/** Shown in place of a page or control the current role cannot use. */
export function NotAllowed({ role, what }) {
  const t = useT();
  return (
    <div className="surface mx-auto mt-10 grid max-w-md justify-items-center gap-3 rounded-2xl p-8 text-center">
      <ShieldAlert size={28} className="text-amber-300" />
      <p className="text-sm text-slate-300">{t("{role} cannot {what}.", { role: t(ROLE_LABEL[role] ?? role), what: t(what) })}</p>
      <p className="text-xs text-slate-500">{t("Switch who you are in the sidebar to try another role.")}</p>
    </div>
  );
}
