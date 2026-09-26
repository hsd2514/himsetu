"use client";
import { createContext, useContext, useEffect, useState } from "react";

/** Nodes a user can "log in" as. FIELD is a Maitri field team on a phone. */
export const NODES = [
  { code: "GOA", label: "NCPOR Goa Hub", tz: "Asia/Kolkata" },
  { code: "SHIP", label: "Ice-class Ship", tz: "UTC" },
  { code: "MAITRI", label: "Maitri Station", tz: "UTC" },
  { code: "BHARATI", label: "Bharati Station", tz: "UTC" },
  { code: "FIELD", label: "Field Team (Maitri)", tz: "UTC" },
];

const StationCtx = createContext({ node: NODES[0], setNodeCode: () => {} });

export function StationProvider({ children }) {
  const [code, setCode] = useState("GOA");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("himsetu.node");
      if (saved && NODES.some((n) => n.code === saved)) setCode(saved);
    } catch {}
  }, []);

  const setNodeCode = (c) => {
    setCode(c);
    try {
      localStorage.setItem("himsetu.node", c);
    } catch {}
  };

  const node = NODES.find((n) => n.code === code) ?? NODES[0];
  return <StationCtx.Provider value={{ node, setNodeCode }}>{children}</StationCtx.Provider>;
}

export const useStation = () => useContext(StationCtx);
