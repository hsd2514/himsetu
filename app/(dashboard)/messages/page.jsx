"use client";
import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Field, Select } from "@/components/ui/field";
import { Composer, useSend } from "@/components/composer";
import { MessageRow } from "@/components/message-row";
import { PassCountdowns } from "@/components/pass-countdown";
import { useMe, useNow } from "@/components/use-me";

export default function MessagesPage() {
  const { me, node, keyReady } = useMe();
  const people = useQuery(api.people.list) ?? [];
  const teams = useQuery(api.people.teams) ?? [];
  const messages = useQuery(api.messages.forPerson, me ? { personId: me._id } : "skip");
  const send = useSend(me);
  const now = useNow(1000);
  const [to, setTo] = useState("station:GOA");
  const [priority, setPriority] = useState("ops");

  const [toType, toId] = to.split(":");
  const remote = me && me.stationCode !== "GOA" ? me.stationCode : null;

  return (
    <>
      <PageHeader title="Messages" subtitle={`As ${me?.name ?? "…"} (${node.label}). Messages from the ice wait for a satellite pass.`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="To">
              <Select value={to} onChange={(e) => setTo(e.target.value)}>
                <optgroup label="Stations">
                  {["GOA", "SHIP", "MAITRI", "BHARATI"].map((s) => <option key={s} value={`station:${s}`}>{s === "GOA" ? "NCPOR Goa Hub" : s[0] + s.slice(1).toLowerCase()}</option>)}
                </optgroup>
                <optgroup label="Teams">
                  {teams.filter((t) => t.memberIds.length).map((t) => <option key={t._id} value={`team:${t._id}`}>{t.name}</option>)}
                </optgroup>
                <optgroup label="People">
                  {people.filter((p) => p._id !== me?._id).map((p) => <option key={p._id} value={`user:${p._id}`}>{p.name}</option>)}
                </optgroup>
                <option value="broadcast:all">Broadcast to everyone</option>
              </Select>
            </Field>
            <Field label="Priority">
              <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="sos">SOS</option>
                <option value="medical">Medical</option>
                <option value="ops">Operations</option>
                <option value="normal">Normal</option>
              </Select>
            </Field>
          </div>
          <Composer disabled={!keyReady} onSend={(text) => send({ toType, toId, priority, text })} />
          {messages === undefined ? (
            <div className="h-40 animate-pulse rounded-lg bg-navy-800" />
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No messages yet for {me?.name}.</p>
          ) : (
            <ul className="grid gap-2">
              {messages.map((m) => <MessageRow key={m._id} m={m} me={me} now={now} />)}
            </ul>
          )}
        </Card>
        <div className="grid content-start gap-3">
          {remote ? <PassCountdowns only={remote} compact /> : <PassCountdowns compact />}
          <p className="text-xs leading-relaxed text-slate-400">
            Order on every pass: SOS, medical, operations, normal, then oldest first. Up to 340 bytes per message and 4 messages per pass. Goa to Goa goes instantly over fibre.
          </p>
        </div>
      </div>
    </>
  );
}
