"use client";
import { useMutation, useQuery } from "convex/react";
import { Car, Footprints, TimerOff } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMe, useNow } from "@/components/use-me";
import { useT } from "@/components/language-context";

/** Field teams with time since last check-in, plus a demo trigger for a missed check-in. */
export function TeamsPanel() {
  const teams = useQuery(api.people.teams);
  const simulate = useMutation(api.sos.simulateMissed);
  const now = useNow(15000);
  const t = useT();
  const { me, can } = useMe();

  return (
    <Card>
      <CardTitle>{t("Field teams")}</CardTitle>
      {teams === undefined ? (
        <div className="mt-3 h-32 animate-pulse rounded-lg bg-white/[0.03]" />
      ) : (
        <ul className="mt-3 divide-y divide-white/[0.06]">
          {teams.map((team) => {
            const mins = Math.floor((now - team.lastCheckIn) / 60000);
            const overdue = mins >= team.checkInEveryMin;
            const Icon = team.kind === "vehicle" ? Car : Footprints;
            return (
              <li key={team._id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <Icon size={15} className="text-slate-500" />
                <span className="min-w-0 flex-1 truncate text-slate-200">{team.name}</span>
                <span className="tnum font-mono text-xs text-slate-400">
                  {t("{m} min ago", { m: mins })} / {team.checkInEveryMin}
                </span>
                {overdue ? <Badge tone="amber">{t("Overdue")}</Badge> : <Badge tone="green">{t("On time")}</Badge>}
                {can("demo.control") && <Button
                  variant="ghost"
                  size="sm"
                  disabled={overdue}
                  onClick={() => simulate({ teamId: team._id })}
                  title={t("Demo: make this team miss its check-in now")}
                >
                  <TimerOff size={14} /> {t("Simulate missed")}
                </Button>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-slate-500">{t("A check-in from the Field page puts a team back on time.")}</p>
    </Card>
  );
}
