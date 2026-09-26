"use client";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useStation } from "@/components/station-context";

export default function MissionPage() {
  const stations = useQuery(api.stations.list);
  const seed = useMutation(api.stations.seed);
  const { node } = useStation();

  return (
    <>
      <PageHeader title="Mission dashboard" subtitle={`Viewing as ${node.label}`} />
      <Card>
        <CardTitle>Resupply chain</CardTitle>
        {stations === undefined && <p className="mt-3 text-sm text-slate-400">Connecting…</p>}
        {stations?.length === 0 && (
          <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
            No data yet. <Button size="sm" onClick={() => seed()}>Load demo data</Button>
          </div>
        )}
        {stations?.length > 0 && (
          <ol className="mt-4 grid gap-3 sm:grid-cols-5">
            {stations.map((s) => (
              <li key={s._id} className="rounded-lg border border-navy-700 bg-navy-800 p-3">
                <div className="font-mono text-xs text-ice-400">{s.code}</div>
                <div className="text-sm font-medium">{s.name}</div>
                <div className="mt-1 text-[11px] text-slate-500">
                  {s.lat.toFixed(2)}, {s.lon.toFixed(2)}
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
