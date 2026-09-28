"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Anchor, Building2, KeyRound, LogIn, Radio, Ship, Snowflake } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { LanguageToggle, useT } from "@/components/language-context";
import { cn } from "@/lib/utils";

// Demo accounts, one per node. The password is set on the Convex deployment (DEMO_PASSWORD).
const ACCOUNTS = [
  { email: "goa@himsetu.demo", label: "NCPOR Goa Hub", role: "Planner (Goa)", icon: Building2 },
  { email: "ship@himsetu.demo", label: "Ice-class Ship", role: "Station lead", icon: Ship },
  { email: "maitri@himsetu.demo", label: "Maitri Station", role: "Station lead", icon: Anchor },
  { email: "bharati@himsetu.demo", label: "Bharati Station", role: "Station lead", icon: Anchor },
  { email: "field@himsetu.demo", label: "Field Team (Maitri)", role: "Field team", icon: Radio },
];

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const demo = useQuery(api.demo.credentials);
  const router = useRouter();
  const t = useT();
  const [email, setEmail] = useState(ACCOUNTS[0].email);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Pre-fill the shared demo password once it arrives.
  useEffect(() => {
    if (demo?.password) setPassword((p) => p || demo.password);
  }, [demo]);

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
    <main className="grid min-h-[100dvh] place-items-center px-4 py-6">
      <div className="grid w-full max-w-4xl items-center gap-8 md:grid-cols-[1fr_1.1fr]">
        <section className="rise hidden md:block">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-ice-400 to-ice-500 text-navy-950">
            <Snowflake size={24} strokeWidth={2.25} />
          </span>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-50">HIMSETU</h1>
          <p className="mt-1 text-sm text-slate-400">हिमसेतु · {t("bridge to the ice")}</p>
          <p className="mt-5 max-w-[40ch] text-sm leading-relaxed text-slate-300">
            {t("Plan it in Goa. Trust it on the ice.")} {t("Each node has its own account. Your role decides what you can do.")}
          </p>
        </section>

        <form onSubmit={submit} className="rise surface grid gap-4 rounded-2xl p-5 md:p-6" style={{ "--i": 1 }}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 md:hidden">
              <Snowflake size={18} className="text-ice-300" />
              <span className="font-semibold tracking-[0.12em] text-slate-50">HIMSETU</span>
            </div>
            <h2 className="hidden text-lg font-semibold text-slate-50 md:block">{t("Sign in")}</h2>
            <LanguageToggle />
          </div>

          <fieldset className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            <legend className="mb-1.5 text-xs text-slate-400">{t("Pick an account")}</legend>
            {ACCOUNTS.map(({ email: e, label, role, icon: Icon }) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmail(e)}
                aria-pressed={email === e}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors active:scale-[0.99]",
                  email === e ? "border-ice-500 bg-ice-500/10" : "border-white/10 hover:border-white/20",
                  e === "field@himsetu.demo" && "sm:col-span-2"
                )}
              >
                <Icon size={16} className={email === e ? "text-ice-300" : "text-slate-500"} />
                <span className="min-w-0 leading-tight">
                  <span className="block truncate text-sm text-slate-100">{t(label)}</span>
                  <span className="block text-[11px] text-slate-400">{t(role)}</span>
                </span>
              </button>
            ))}
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs text-slate-400">{t("Email")}</span>
              <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value.trim().toLowerCase())} required />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="text-xs text-slate-400">{t("Password")}</span>
              <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
          </div>
          {error && <p className="-mt-1 text-xs text-red-300">{error}</p>}

          <Button type="submit" size="lg" disabled={busy || isLoading || !password}>
            <LogIn size={18} /> {busy ? t("Signing in…") : t("Sign in")}
          </Button>

          {demo?.password && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-lg border border-dashed border-white/10 px-3 py-2 text-xs text-slate-400">
              <KeyRound size={13} className="text-ice-300" />
              <span>{t("Test login")}:</span>
              <span className="font-mono text-slate-200">{email}</span>
              <span>/</span>
              <span className="font-mono text-slate-200">{demo.password}</span>
              <span className="w-full text-[11px] text-slate-500">{t("Same password for all five demo accounts.")}</span>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}
