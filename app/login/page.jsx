"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { LogIn, Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { LanguageToggle, useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

// Demo accounts, one per node. The password is set on the Convex deployment (DEMO_PASSWORD).
const ACCOUNTS = [
  { email: "goa@himsetu.demo", label: "NCPOR Goa Hub", role: "Planner (Goa)" },
  { email: "ship@himsetu.demo", label: "Ice-class Ship", role: "Station lead" },
  { email: "maitri@himsetu.demo", label: "Maitri Station", role: "Station lead" },
  { email: "bharati@himsetu.demo", label: "Bharati Station", role: "Station lead" },
  { email: "field@himsetu.demo", label: "Field Team (Maitri)", role: "Field team" },
];

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState(ACCOUNTS[0].email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isAuthenticated) router.replace(email === "field@himsetu.demo" ? "/field" : "/");
  }, [isAuthenticated, router, email]);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch {
      setError(t("Wrong email or password."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-ice-400 to-ice-500 text-navy-950">
              <Snowflake size={20} strokeWidth={2.25} />
            </span>
            <div className="leading-tight">
              <div className="text-lg font-semibold tracking-[0.12em] text-slate-50">HIMSETU</div>
              <div className="text-xs text-slate-400">हिमसेतु · {t("bridge to the ice")}</div>
            </div>
          </div>
          <LanguageToggle />
        </div>

        <form onSubmit={submit} className="surface grid gap-5 rounded-2xl p-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-50">{t("Sign in")}</h1>
            <p className="mt-1 text-sm text-slate-400">{t("Each node has its own account. Your role decides what you can do.")}</p>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-2 text-sm text-slate-300">{t("Account")}</legend>
            {ACCOUNTS.map((a) => (
              <label
                key={a.email}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm transition-colors",
                  email === a.email ? "border-ice-500 bg-ice-500/10" : "border-white/10 hover:border-white/20"
                )}
              >
                <span className="flex items-center gap-2">
                  <input type="radio" name="account" value={a.email} checked={email === a.email} onChange={() => setEmail(a.email)} className="accent-ice-500" />
                  <span className="text-slate-100">{t(a.label)}</span>
                </span>
                <span className="text-xs text-slate-400">{t(a.role)}</span>
              </label>
            ))}
          </fieldset>

          <Field label={t("Email")}>
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value.trim().toLowerCase())} required />
          </Field>
          <Field label={t("Password")} error={error}>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>

          <Button type="submit" size="lg" disabled={busy || isLoading || !password}>
            <LogIn size={18} /> {busy ? t("Signing in…") : t("Sign in")}
          </Button>
        </form>
        <p className="mt-4 text-center text-xs text-slate-500">{t("Prototype. Demo accounts share one password, set by the expedition team.")}</p>
      </div>
    </main>
  );
}
