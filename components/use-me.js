"use client";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStation } from "@/components/station-context";
import { getOrCreateKeypair } from "@/lib/crypto";
import { can } from "@/lib/rbac";

/** The person behind the current "log in as" node, with a device keypair registered. */
export function useMe() {
  const { node } = useStation();
  const me = useQuery(api.people.byNode, { nodeCode: node.code });
  const registerKey = useMutation(api.people.registerKey);
  const [keyReady, setKeyReady] = useState(false);

  useEffect(() => {
    if (!me) return;
    let alive = true;
    getOrCreateKeypair(me._id).then(({ publicKey }) => {
      if (me.publicKey !== publicKey) registerKey({ personId: me._id, publicKey });
      if (alive) setKeyReady(true);
    });
    return () => {
      alive = false;
    };
  }, [me, registerKey]);

  return { me, node, keyReady, can: (perm) => can(me?.role, perm) };
}

/** Re-render every `ms` so countdowns tick. */
export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}
