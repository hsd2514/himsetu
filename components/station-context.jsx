"use client";
import { createContext, useContext } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/** The five places people work from. FIELD is a Maitri field team on a phone. */
export const NODES = [
  { code: "GOA", label: "NCPOR Goa Hub", tz: "Asia/Kolkata" },
  { code: "SHIP", label: "Ice-class Ship", tz: "UTC" },
  { code: "MAITRI", label: "Maitri Station", tz: "UTC" },
  { code: "BHARATI", label: "Bharati Station", tz: "UTC" },
  { code: "FIELD", label: "Field Team (Maitri)", tz: "UTC" },
];

const StationCtx = createContext({ node: NODES[0], me: undefined });

/**
 * Who is signed in, and the node they work from. `me` is undefined while loading
 * and null when signed out (or the account is not linked to a person yet).
 */
export function StationProvider({ children }) {
  const me = useQuery(api.people.me);
  const node = NODES.find((n) => n.code === me?.nodeCode) ?? NODES[0];
  return <StationCtx.Provider value={{ node, me }}>{children}</StationCtx.Provider>;
}

export const useStation = () => useContext(StationCtx);
