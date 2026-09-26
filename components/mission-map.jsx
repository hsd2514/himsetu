"use client";
import dynamic from "next/dynamic";

// Leaflet touches `window`, so it only renders in the browser.
export const MissionMap = dynamic(() => import("@/components/map-inner"), {
  ssr: false,
  loading: () => <div className="h-[380px] animate-pulse rounded-xl bg-navy-900" />,
});
