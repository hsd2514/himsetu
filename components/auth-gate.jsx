"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useStation } from "@/components/station-context";
import { useT } from "@/components/language-context";

/** Only signed-in expedition members see the dashboard. Everyone else goes to /login. */
export function AuthGate({ children }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { me } = useStation();
  const router = useRouter();
  const t = useT();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace("/login");
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated || me === undefined) {
    return <div className="grid min-h-[100dvh] place-items-center text-sm text-slate-500">{t("Loading…")}</div>;
  }
  if (me === null) {
    // Signed in, but the seed has not linked this account to a person yet (e.g. right after a reset).
    return <div className="grid min-h-[100dvh] place-items-center text-sm text-slate-400">{t("Setting up your account…")}</div>;
  }
  return children;
}
